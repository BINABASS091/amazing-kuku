from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.models import ContentType
from .models import (
    User, Farm, Batch, Device, SensorReading, SubscriptionPlan, 
    Subscription, Payment, InventoryCategory, InventoryItem, 
    InventoryTransaction, AlertRule, Alert, ActivityType, Activity, APIAccessLog
)

# User Serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'role', 'address', 'profile_picture',
            'is_active', 'is_staff', 'date_joined', 'last_login'
        ]
        read_only_fields = ['is_active', 'is_staff', 'date_joined', 'last_login']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'first_name', 'last_name', 'phone_number', 'role', 'address']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'address', 'profile_picture']

# Farm Serializers
class FarmSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    
    class Meta:
        model = Farm
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class FarmCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = ['name', 'location', 'size', 'description']

# Batch Serializers
class BatchSerializer(serializers.ModelSerializer):
    farm = FarmSerializer(read_only=True)
    age_days = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'current_count']

class BatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = ['farm', 'name', 'breed', 'start_date', 'end_date', 'initial_count', 'notes']

class BatchStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Batch.BATCH_STATUS)
    notes = serializers.CharField(required=False, allow_blank=True)

# Device Serializers
class DeviceSerializer(serializers.ModelSerializer):
    farm = FarmSerializer(read_only=True)
    batch = BatchSerializer(read_only=True)
    
    class Meta:
        model = Device
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'last_seen']

class DeviceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['name', 'device_type', 'device_id', 'farm', 'batch', 'status', 'metadata']

class DeviceStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Device.STATUS_CHOICES)
    metadata = serializers.JSONField(required=False)

# Sensor Reading Serializers
class SensorReadingSerializer(serializers.ModelSerializer):
    device = DeviceSerializer(read_only=True)
    
    class Meta:
        model = SensorReading
        fields = '__all__'
        read_only_fields = ['created_at']

class SensorReadingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorReading
        fields = [
            'device', 'temperature', 'humidity', 
            'feed_level', 'water_level', 'battery_level', 
            'reading_time', 'raw_data'
        ]

# Subscription Serializers
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'is_active']

class SubscriptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['plan', 'start_date', 'end_date']

class PaymentSerializer(serializers.ModelSerializer):
    subscription = SubscriptionSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'status']

# Inventory Serializers
class InventoryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryCategory
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    category = InventoryCategorySerializer(read_only=True)
    farm = FarmSerializer(read_only=True)
    needs_restock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'current_quantity']

class InventoryItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = [
            'name', 'description', 'category', 'farm', 'unit', 
            'minimum_quantity', 'unit_price', 'expiry_date', 
            'batch_number', 'supplier', 'is_active'
        ]

class InventoryTransactionSerializer(serializers.ModelSerializer):
    item = InventoryItemSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['created_at', 'total_amount']

class InventoryTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = [
            'item', 'transaction_type', 'quantity', 'unit_price', 
            'notes', 'reference', 'transaction_date'
        ]
    
    def validate(self, data):
        if data['transaction_type'] in ['usage', 'wastage', 'transfer_out']:
            if data['quantity'] > data['item'].current_quantity:
                raise serializers.ValidationError("Insufficient quantity in inventory.")
        return data

# Alert Serializers
class AlertRuleSerializer(serializers.ModelSerializer):
    recipients = UserSerializer(many=True, read_only=True)
    farm = FarmSerializer(read_only=True)
    batch = BatchSerializer(read_only=True)
    device = DeviceSerializer(read_only=True)
    inventory_item = serializers.PrimaryKeyRelatedField(queryset=InventoryItem.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = AlertRule
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class AlertRuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = [
            'name', 'description', 'condition_type', 'condition_value', 
            'severity', 'is_active', 'notification_methods', 'recipients',
            'farm', 'batch', 'device', 'inventory_item', 'cooldown_minutes'
        ]

class AlertSerializer(serializers.ModelSerializer):
    rule = AlertRuleSerializer(read_only=True)
    acknowledged_by = UserSerializer(read_only=True)
    resolved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Alert
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 'acknowledged_at', 
            'resolved_at', 'resolved_by', 'acknowledged_by'
        ]

class AlertAcknowledgeSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)

class AlertResolveSerializer(serializers.Serializer):
    resolution_notes = serializers.CharField(required=False, allow_blank=True)

# Activity Serializers
class ActivityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityType
        fields = '__all__'

class ActivitySerializer(serializers.ModelSerializer):
    activity_type = ActivityTypeSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    content_object = serializers.SerializerMethodField()
    
    class Meta:
        model = Activity
        fields = '__all__'
    
    def get_content_object(self, obj):
        if obj.content_object:
            # You can add more specific serialization for different content types if needed
            return str(obj.content_object)
        return None

# API Access Log Serializer
class APIAccessLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = APIAccessLog
        fields = '__all__'

# Helper function to get serializer by model name
def get_serializer_by_model(model_name):
    """
    Returns the appropriate serializer class based on the model name.
    Usage: serializer_class = get_serializer_by_model('User')()
    """
    serializers_map = {
        'User': UserSerializer,
        'Farm': FarmSerializer,
        'Batch': BatchSerializer,
        'Device': DeviceSerializer,
        'SensorReading': SensorReadingSerializer,
        'SubscriptionPlan': SubscriptionPlanSerializer,
        'Subscription': SubscriptionSerializer,
        'Payment': PaymentSerializer,
        'InventoryCategory': InventoryCategorySerializer,
        'InventoryItem': InventoryItemSerializer,
        'InventoryTransaction': InventoryTransactionSerializer,
        'AlertRule': AlertRuleSerializer,
        'Alert': AlertSerializer,
        'ActivityType': ActivityTypeSerializer,
        'Activity': ActivitySerializer,
        'APIAccessLog': APIAccessLogSerializer,
    }
    
    return serializers_map.get(model_name, serializers.Serializer)
