import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  businessName: string;
  location: string;
  phoneNumber: string;
  experienceYears: string;
}

export function Signup() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    location: '',
    phoneNumber: '',
    experienceYears: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Trim and validate all inputs
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedFullName = formData.fullName.trim();
    const trimmedBusinessName = formData.businessName.trim();
    const trimmedLocation = formData.location.trim();
    const trimmedPhoneNumber = formData.phoneNumber.trim();

    // Validation
    if (!trimmedFullName) {
      setError('Full name is required');
      return;
    }

    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!trimmedBusinessName) {
      setError('Business name is required');
      return;
    }

    if (!trimmedLocation) {
      setError('Location is required');
      return;
    }

    if (!trimmedPhoneNumber) {
      setError('Phone number is required');
      return;
    }

    // Phone number validation (basic)
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(trimmedPhoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      await signUp(trimmedEmail, formData.password, trimmedFullName, 'FARMER', {
        businessName: trimmedBusinessName,
        location: trimmedLocation,
        phoneNumber: trimmedPhoneNumber,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : 0,
      });      // Show success message
      alert('Account created successfully! Please log in to continue.');
      navigate('/login');
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle specific error cases
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. Please try logging in instead or use a different email.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <img 
                src="https://res.cloudinary.com/diyy8h0d9/image/upload/v1759477181/WhatsApp_Image_2025-09-10_at_10.41.48_AM_klrrtu.jpg" 
                alt="FugajiPro Logo" 
                className="w-42 h-30 mx-auto rounded-lg object-contain shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Manage Your Poultry</h1>
            <h3 className="text-3xl font-bold text-green-600 mb-2">With FugajiPro</h3>
            <p className="text-gray-600">Create your account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
                {error.includes('already registered') && (
                  <Link 
                    to="/login" 
                    className="text-sm text-red-700 underline hover:text-red-800 mt-1 inline-block"
                  >
                    Go to login page
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                name="fullName"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                name="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                name="password"
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                name="confirmPassword"
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="Re-enter your password"
              />
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleInputChange}
                name="businessName"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="e.g., Sunrise Poultry Farm"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                name="location"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="e.g., Nairobi, Kenya"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                name="phoneNumber"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="e.g., +255 123 456 789"
              />
            </div>

            <div>
              <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                id="experienceYears"
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={handleInputChange}
                name="experienceYears"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
