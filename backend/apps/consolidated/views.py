from rest_framework import viewsets, status, mixins, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Q, F, Count, Sum, Avg, Max, Min, DateTimeField
from django.db.models.functions import Trunc
from django.utils import timezone
from datetime import timedelta
import logging

from .models import (
    User, Farm, Batch, Device, SensorReading, SubscriptionPlan, 
    Subscription, Payment, InventoryCategory, InventoryItem, 
    InventoryTransaction, AlertRule, Alert, ActivityType, Activity, APIAccessLog
)
from .serializers import *
from .permissions import (
    IsAdminOrReadOnly, IsOwnerOrReadOnly, IsFarmerOrAdmin, 
    IsFarmOwner, IsSubscriptionOwner, IsFarmWorker, IsOwnerOrAdmin
)

logger = logging.getLogger(__name__)

# User Views
class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['email', 'date_joined', 'last_login']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        # Admins can see all users, others can only see themselves
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Return the current user's profile.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Change the current user's password.
        """
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not all([old_password, new_password]):
            return Response(
                {'error': 'Both old_password and new_password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Incorrect old password'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        return Response({'status': 'password updated'})

# Farm Views
class FarmViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows farms to be viewed or edited.
    """
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'location', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    filterset_fields = ['owner', 'size']
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return FarmCreateSerializer
        return FarmSerializer
    
    def get_queryset(self):
        # Admins can see all farms, others can only see their own farms or farms they work on
        user = self.request.user
        if user.is_staff:
            return Farm.objects.all()
        
        # Get farms where user is the owner or a worker
        return Farm.objects.filter(
            Q(owner=user) | 
            Q(workers=user)
        ).distinct()
    
    def perform_create(self, serializer):
        # Set the current user as the owner when creating a new farm
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_worker(self, request, pk=None):
        """
        Add a worker to the farm.
        """
        farm = self.get_object()
        worker_id = request.data.get('user_id')
        
        if not worker_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            worker = User.objects.get(id=worker_id, role='worker')
        except User.DoesNotExist:
            return Response(
                {'error': 'Worker not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        farm.workers.add(worker)
        return Response({'status': 'worker added'})
    
    @action(detail=True, methods=['post'])
    def remove_worker(self, request, pk=None):
        """
        Remove a worker from the farm.
        """
        farm = self.get_object()
        worker_id = request.data.get('user_id')
        
        if not worker_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            worker = User.objects.get(id=worker_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        farm.workers.remove(worker)
        return Response({'status': 'worker removed'})

# Batch Views
class BatchViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows batches to be viewed or edited.
    """
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated, IsFarmWorker]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'breed', 'notes']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    filterset_fields = ['farm', 'status', 'breed']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BatchCreateSerializer
        elif self.action == 'update_status':
            return BatchStatusUpdateSerializer
        return BatchSerializer
    
    def get_queryset(self):
        # Admins can see all batches, others can only see batches from their farms
        user = self.request.user
        if user.is_staff:
            return Batch.objects.all()
        
        # Get batches from farms where user is the owner or a worker
        return Batch.objects.filter(
            Q(farm__owner=user) | 
            Q(farm__workers=user)
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update the status of a batch.
        """
        batch = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            notes = serializer.validated_data.get('notes', '')
            
            # Add status change to notes
            if notes:
                notes = f"Status changed to {new_status}. {notes}"
            else:
                notes = f"Status changed to {new_status}"
            
            batch.status = new_status
            batch.notes = f"{batch.notes}\n{notes}" if batch.notes else notes
            batch.save()
            
            return Response({'status': 'status updated'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Device Views
class DeviceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows devices to be viewed or edited.
    """
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated, IsFarmWorker]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'device_id', 'device_type']
    ordering_fields = ['name', 'device_type', 'last_seen', 'created_at']
    filterset_fields = ['farm', 'batch', 'device_type', 'status']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DeviceCreateSerializer
        elif self.action == 'update_status':
            return DeviceStatusUpdateSerializer
        return DeviceSerializer
    
    def get_queryset(self):
        # Admins can see all devices, others can only see devices from their farms
        user = self.request.user
        if user.is_staff:
            return Device.objects.all()
        
        # Get devices from farms where user is the owner or a worker
        return Device.objects.filter(
            Q(farm__owner=user) | 
            Q(farm__workers=user)
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update the status of a device.
        """
        device = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            device.status = serializer.validated_data['status']
            device.metadata.update(serializer.validated_data.get('metadata', {}))
            device.save()
            
            return Response({'status': 'device status updated'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def submit_reading(self, request, pk=None):
        """
        Submit a sensor reading for a device.
        """
        device = self.get_object()
        serializer = SensorReadingCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Set the device and save the reading
            reading = serializer.save(device=device)
            
            # Update device last seen
            device.last_seen = timezone.now()
            device.save()
            
            # Check for alert rules and trigger alerts if needed
            self._check_alert_rules(reading)
            
            return Response(
                {'status': 'reading submitted', 'id': str(reading.id)},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _check_alert_rules(self, reading):
        """
        Check if the reading triggers any alert rules.
        """
        # Get all active alert rules for this device
        alert_rules = AlertRule.objects.filter(
            device=reading.device,
            is_active=True
        )
        
        for rule in alert_rules:
            try:
                if self._is_condition_met(rule, reading):
                    self._trigger_alert(rule, reading)
            except Exception as e:
                logger.error(f"Error checking alert rule {rule.id}: {str(e)}")
    
    def _is_condition_met(self, rule, reading):
        """
        Check if the reading meets the alert rule condition.
        """
        if rule.condition_type == 'temperature_gt' and reading.temperature is not None:
            return reading.temperature > rule.condition_value
        elif rule.condition_type == 'temperature_lt' and reading.temperature is not None:
            return reading.temperature < rule.condition_value
        elif rule.condition_type == 'humidity_gt' and reading.humidity is not None:
            return reading.humidity > rule.condition_value
        elif rule.condition_type == 'humidity_lt' and reading.humidity is not None:
            return reading.humidity < rule.condition_value
        elif rule.condition_type == 'feed_level_lt' and reading.feed_level is not None:
            return reading.feed_level < rule.condition_value
        elif rule.condition_type == 'water_level_lt' and reading.water_level is not None:
            return reading.water_level < rule.condition_value
        
        return False
    
    def _trigger_alert(self, rule, reading):
        """
        Create an alert based on the rule and reading.
        """
        # Check if there's a recent alert for this rule to avoid duplicates
        recent_alert = Alert.objects.filter(
            rule=rule,
            status='triggered',
            created_at__gt=timezone.now() - timedelta(minutes=rule.cooldown_minutes)
        ).first()
        
        if recent_alert:
            return  # Skip creating a new alert if there's a recent one
        
        # Create the alert
        Alert.objects.create(
            rule=rule,
            status='triggered',
            title=f"{rule.get_condition_type_display()} {rule.condition_value}",
            message=f"{rule.name}: {rule.get_condition_type_display()} {rule.condition_value}",
            severity=rule.severity,
            triggered_value=self._get_reading_value(rule.condition_type, reading)
        )
    
    def _get_reading_value(self, condition_type, reading):
        """
        Get the relevant value from the reading based on the condition type.
        """
        if 'temperature' in condition_type:
            return reading.temperature
        elif 'humidity' in condition_type:
            return reading.humidity
        elif 'feed_level' in condition_type:
            return reading.feed_level
        elif 'water_level' in condition_type:
            return reading.water_level
        return 0

# Sensor Reading Views
class SensorReadingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows sensor readings to be viewed.
    """
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAuthenticated, IsFarmWorker]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['reading_time', 'created_at']
    filterset_fields = ['device', 'device__farm', 'device__batch']
    
    def get_queryset(self):
        # Admins can see all readings, others can only see readings from their farms
        user = self.request.user
        if user.is_staff:
            return SensorReading.objects.all()
        
        # Get readings from devices where user is the owner or a worker
        return SensorReading.objects.filter(
            Q(device__farm__owner=user) | 
            Q(device__farm__workers=user)
        ).distinct()
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get the latest reading for each device.
        """
        devices = Device.objects.all()
        if not request.user.is_staff:
            devices = devices.filter(
                Q(farm__owner=request.user) | 
                Q(farm__workers=request.user)
            ).distinct()
        
        latest_readings = []
        for device in devices:
            reading = device.readings.order_by('-reading_time').first()
            if reading:
                latest_readings.append(reading)
        
        page = self.paginate_queryset(latest_readings)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(latest_readings, many=True)
        return Response(serializer.data)

# Subscription Plan Views
class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows subscription plans to be viewed.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # No pagination for plans

# Subscription Views
class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows subscriptions to be viewed or edited.
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated, IsSubscriptionOwner]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['start_date', 'end_date', 'created_at']
    filterset_fields = ['plan', 'status', 'is_active']
    
    def get_queryset(self):
        # Admins can see all subscriptions, others can only see their own
        if self.request.user.is_staff:
            return Subscription.objects.all()
        return Subscription.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Set the current user as the subscriber when creating a new subscription
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a subscription.
        """
        subscription = self.get_object()
        subscription.status = 'cancelled'
        subscription.is_active = False
        subscription.save()
        
        return Response({'status': 'subscription cancelled'})

# Payment Views
class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows payments to be viewed.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsSubscriptionOwner]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['payment_date', 'created_at']
    filterset_fields = ['subscription', 'status', 'payment_method']
    
    def get_queryset(self):
        # Admins can see all payments, others can only see their own
        if self.request.user.is_staff:
            return Payment.objects.all()
        
        # Get payments for the user's subscriptions
        return Payment.objects.filter(subscription__user=self.request.user)

# Inventory Category Views
class InventoryCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows inventory categories to be viewed.
    """
    queryset = InventoryCategory.objects.all()
    serializer_class = InventoryCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # No pagination for categories

# Inventory Item Views
class InventoryItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows inventory items to be viewed or edited.
    """
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated, IsFarmWorker]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'batch_number', 'supplier']
    ordering_fields = ['name', 'current_quantity', 'expiry_date', 'created_at']
    filterset_fields = ['farm', 'category', 'is_active']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InventoryItemCreateSerializer
        return InventoryItemSerializer
    
    def get_queryset(self):
        # Admins can see all items, others can only see items from their farms
        user = self.request.user
        if user.is_staff:
            return InventoryItem.objects.all()
        
        # Get items from farms where user is the owner or a worker
        return InventoryItem.objects.filter(
            Q(farm__owner=user) | 
            Q(farm__workers=user)
        ).distinct()
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """
        Get all transactions for this inventory item.
        """
        item = self.get_object()
        transactions = item.transactions.all()
        
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = InventoryTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = InventoryTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_stock(self, request, pk=None):
        """
        Add stock to an inventory item.
        """
        item = self.get_object()
        quantity = request.data.get('quantity')
        unit_price = request.data.get('unit_price')
        notes = request.data.get('notes', '')
        
        if not quantity or not unit_price:
            return Response(
                {'error': 'quantity and unit_price are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity = float(quantity)
            unit_price = float(unit_price)
        except (TypeError, ValueError):
            return Response(
                {'error': 'quantity and unit_price must be numbers'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the transaction
        transaction = InventoryTransaction.objects.create(
            item=item,
            transaction_type='purchase',
            quantity=quantity,
            unit_price=unit_price,
            notes=notes,
            created_by=request.user
        )
        
        # Update the item's current quantity
        item.current_quantity += quantity
        item.unit_price = unit_price  # Update the current unit price
        item.save()
        
        return Response(
            {'status': 'stock added', 'transaction_id': str(transaction.id)},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def remove_stock(self, request, pk=None):
        """
        Remove stock from an inventory item.
        """
        item = self.get_object()
        quantity = request.data.get('quantity')
        notes = request.data.get('notes', '')
        
        if not quantity:
            return Response(
                {'error': 'quantity is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity = float(quantity)
        except (TypeError, ValueError):
            return Response(
                {'error': 'quantity must be a number'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity > item.current_quantity:
            return Response(
                {'error': 'not enough stock available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the transaction
        transaction = InventoryTransaction.objects.create(
            item=item,
            transaction_type='usage',
            quantity=quantity,
            unit_price=item.unit_price,  # Use the current unit price
            notes=notes,
            created_by=request.user
        )
        
        # Update the item's current quantity
        item.current_quantity -= quantity
        item.save()
        
        return Response(
            {'status': 'stock removed', 'transaction_id': str(transaction.id)},
            status=status.HTTP_201_CREATED
        )

# Inventory Transaction Views
class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows inventory transactions to be viewed.
    """
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated, IsFarmWorker]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['transaction_date', 'created_at']
    filterset_fields = ['item', 'transaction_type', 'created_by']
    
    def get_queryset(self):
        # Admins can see all transactions, others can only see transactions from their farms
        user = self.request.user
        if user.is_staff:
            return InventoryTransaction.objects.all()
        
        # Get transactions for items from farms where user is the owner or a worker
        return InventoryTransaction.objects.filter(
            Q(item__farm__owner=user) | 
            Q(item__farm__workers=user)
        ).distinct()

# Alert Rule Views
class AlertRuleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows alert rules to be viewed or edited.
    """
    serializer_class = AlertRuleSerializer
    permission_classes = [IsAuthenticated, IsFarmWorker]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    filterset_fields = ['farm', 'batch', 'device', 'inventory_item', 'is_active']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AlertRuleCreateSerializer
        return AlertRuleSerializer
    
    def get_queryset(self):
        # Admins can see all alert rules, others can only see rules for their farms
        user = self.request.user
        if user.is_staff:
            return AlertRule.objects.all()
        
        # Get alert rules for farms where user is the owner or a worker
        return AlertRule.objects.filter(
            Q(farm__owner=user) | 
            Q(farm__workers=user) |
            Q(recipients=user)
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """
        Test an alert rule by triggering it immediately.
        """
        rule = self.get_object()
        
        # Create a test alert
        alert = Alert.objects.create(
            rule=rule,
            status='triggered',
            title=f"Test Alert: {rule.name}",
            message=f"This is a test alert for the rule: {rule.name}",
            severity=rule.severity,
            triggered_value=rule.condition_value
        )
        
        return Response(
            {'status': 'test alert triggered', 'alert_id': str(alert.id)},
            status=status.HTTP_201_CREATED
        )

# Alert Views
class AlertViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows alerts to be viewed or updated.
    """
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated, IsFarmWorker]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['created_at', 'updated_at', 'acknowledged_at', 'resolved_at']
    filterset_fields = ['rule', 'status', 'severity', 'acknowledged_by', 'resolved_by']
    
    def get_queryset(self):
        # Admins can see all alerts, others can only see alerts for their farms or rules they're recipients of
        user = self.request.user
        if user.is_staff:
            return Alert.objects.all()
        
        # Get alerts for farms where user is the owner or a worker, or rules they're recipients of
        return Alert.objects.filter(
            Q(rule__farm__owner=user) | 
            Q(rule__farm__workers=user) |
            Q(rule__recipients=user)
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """
        Acknowledge an alert.
        """
        alert = self.get_object()
        serializer = AlertAcknowledgeSerializer(data=request.data)
        
        if serializer.is_valid():
            alert.status = 'acknowledged'
            alert.acknowledged_by = request.user
            alert.acknowledged_at = timezone.now()
            alert.notes = serializer.validated_data.get('notes', '')
            alert.save()
            
            return Response({'status': 'alert acknowledged'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Resolve an alert.
        """
        alert = self.get_object()
        serializer = AlertResolveSerializer(data=request.data)
        
        if serializer.is_valid():
            alert.status = 'resolved'
            alert.resolved_by = request.user
            alert.resolved_at = timezone.now()
            alert.resolution_notes = serializer.validated_data.get('resolution_notes', '')
            alert.save()
            
            return Response({'status': 'alert resolved'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Activity Type Views
class ActivityTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows activity types to be viewed.
    """
    queryset = ActivityType.objects.all()
    serializer_class = ActivityTypeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]  # Only admins can view activity types
    pagination_class = None  # No pagination for activity types

# Activity Views
class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows activities to be viewed.
    """
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['created_at']
    filterset_fields = ['activity_type', 'user', 'content_type', 'object_id']
    
    def get_queryset(self):
        # Admins can see all activities, others can only see their own activities
        if self.request.user.is_staff:
            return Activity.objects.all()
        return Activity.objects.filter(user=self.request.user)

# API Access Log Views
class APIAccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows API access logs to be viewed.
    """
    serializer_class = APIAccessLogSerializer
    permission_classes = [IsAdminUser]  # Only admins can view API access logs
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['created_at']
    filterset_fields = ['user', 'method', 'status_code', 'path']
    
    def get_queryset(self):
        return APIAccessLog.objects.all()

# Dashboard Views
class DashboardViewSet(viewsets.ViewSet):
    """
    API endpoint for dashboard data.
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """
        Get dashboard statistics and overview data.
        """
        user = request.user
        
        # Initialize response data
        data = {
            'user': {},
            'farms': {},
            'batches': {},
            'devices': {},
            'alerts': {},
            'inventory': {}
        }
        
        # User data
        data['user'] = {
            'name': user.get_full_name() or user.email,
            'role': user.get_role_display(),
            'joined': user.date_joined,
            'last_login': user.last_login
        }
        
        # Get user's farms
        if user.is_staff:
            farms = Farm.objects.all()
            batches = Batch.objects.all()
            devices = Device.objects.all()
            alerts = Alert.objects.filter(status='triggered')
            inventory_items = InventoryItem.objects.all()
        else:
            farms = Farm.objects.filter(
                Q(owner=user) | 
                Q(workers=user)
            ).distinct()
            
            farm_ids = farms.values_list('id', flat=True)
            
            batches = Batch.objects.filter(farm__in=farm_ids)
            devices = Device.objects.filter(farm__in=farm_ids)
            
            # Get alerts for the user's farms or where the user is a recipient
            alerts = Alert.objects.filter(
                Q(rule__farm__in=farms) |
                Q(rule__recipients=user)
            ).filter(status='triggered').distinct()
            
            inventory_items = InventoryItem.objects.filter(farm__in=farm_ids)
        
        # Farm data
        data['farms'] = {
            'total': farms.count(),
            'by_status': list(farms.values('status').annotate(count=Count('id')))
        }
        
        # Batch data
        data['batches'] = {
            'total': batches.count(),
            'by_status': list(batches.values('status').annotate(count=Count('id'))),
            'by_breed': list(batches.values('breed').annotate(count=Count('id')).order_by('-count')[:5])
        }
        
        # Device data
        data['devices'] = {
            'total': devices.count(),
            'by_type': list(devices.values('device_type').annotate(count=Count('id'))),
            'by_status': list(devices.values('status').annotate(count=Count('id')))
        }
        
        # Alert data
        data['alerts'] = {
            'total': alerts.count(),
            'by_severity': list(alerts.values('severity').annotate(count=Count('id'))),
            'recent': AlertSerializer(alerts.order_by('-created_at')[:5], many=True).data
        }
        
        # Inventory data
        low_stock_items = inventory_items.filter(
            current_quantity__lte=F('minimum_quantity'),
            is_active=True
        )
        
        data['inventory'] = {
            'total_items': inventory_items.count(),
            'low_stock': low_stock_items.count(),
            'total_value': sum(item.current_quantity * (item.unit_price or 0) for item in inventory_items)
        }
        
        # Add recent activities
        recent_activities = Activity.objects.all().order_by('-created_at')[:10]
        data['recent_activities'] = ActivitySerializer(recent_activities, many=True).data
        
        return Response(data)
