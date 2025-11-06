from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .views import (
    UserViewSet, FarmViewSet, BatchViewSet, DeviceViewSet, 
    SensorReadingViewSet, SubscriptionPlanViewSet, SubscriptionViewSet,
    PaymentViewSet, InventoryCategoryViewSet, InventoryItemViewSet, 
    InventoryTransactionViewSet, AlertRuleViewSet, AlertViewSet,
    ActivityTypeViewSet, ActivityViewSet, APIAccessLogViewSet, DashboardViewSet
)

# Create a router for our viewsets
router = DefaultRouter()

# User management
router.register(r'users', UserViewSet, basename='user')

# Farm management
router.register(r'farms', FarmViewSet, basename='farm')
router.register(r'batches', BatchViewSet, basename='batch')

# Device management
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'sensor-readings', SensorReadingViewSet, basename='sensorreading')

# Subscription management
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscriptionplan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'payments', PaymentViewSet, basename='payment')

# Inventory management
router.register(r'inventory/categories', InventoryCategoryViewSet, basename='inventorycategory')
router.register(r'inventory/items', InventoryItemViewSet, basename='inventoryitem')
router.register(r'inventory/transactions', InventoryTransactionViewSet, basename='inventorytransaction')

# Alert management
router.register(r'alert-rules', AlertRuleViewSet, basename='alertrule')
router.register(r'alerts', AlertViewSet, basename='alert')

# Activity logging
router.register(r'activity-types', ActivityTypeViewSet, basename='activitytype')
router.register(r'activities', ActivityViewSet, basename='activity')

# Admin only
router.register(r'api-access-logs', APIAccessLogViewSet, basename='apiaccesslog')

# Dashboard
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

# Additional URL patterns
urlpatterns = [
    # API root
    path('', include(router.urls)),
    
    # JWT Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API documentation (to be implemented)
    path('docs/', include('rest_framework.urls', namespace='rest_framework')),
    
    # Health check endpoint
    path('health/', lambda request: JsonResponse({'status': 'ok'})),
]

# Add static and media file serving in development
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
