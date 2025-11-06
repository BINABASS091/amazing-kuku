from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit, but anyone to view.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to admin users.
        return request.user and request.user.is_staff

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        return obj.owner == request.user

class IsFarmerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow farmers or admins to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role == 'farmer' or request.user.is_staff)

class IsFarmOwner(permissions.BasePermission):
    """
    Custom permission to only allow the owner of a farm to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Allow read permissions for GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Check if the user is the owner of the farm
        return obj.owner == request.user

class IsFarmWorker(permissions.BasePermission):
    """
    Custom permission to allow farm workers or owners to access farm-related objects.
    """
    def has_object_permission(self, request, view, obj):
        # Allow read permissions for GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For write operations, check if user is the owner or a worker
        if hasattr(obj, 'farm'):
            return obj.farm.owner == request.user or request.user in obj.farm.workers.all()
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False

class IsSubscriptionOwner(permissions.BasePermission):
    """
    Custom permission to only allow the owner of a subscription to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Allow read permissions for GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Check if the user is the owner of the subscription
        return obj.user == request.user

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Allow read permissions for GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Check if the user is an admin or the owner of the object
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.is_staff
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user or request.user.is_staff
        return request.user.is_staff
