import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dog, Cat, Calendar, Info, Heart, Camera, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface PetFormData {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  weight: string;
  birth_date: string;
  gender: 'male' | 'female' | 'unknown';

  special_needs: string;
  medical_conditions: string;
  photo_url: string | null;
}

export const PetRegistrationForm: React.FC<{
  qrCodeId?: string;
  onComplete?: (petId: string) => void;
}> = ({ qrCodeId, onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: 'dog',
    breed: '',
    color: '',
    size: 'medium',
    weight: '',
    birth_date: '',
    gender: 'unknown',
    special_needs: '',
    medical_conditions: '',
    photo_url: null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `pet-photos/${fileName}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('pets')
      .upload(filePath, photoFile);
      
    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('pets')
      .getPublicUrl(filePath);
      
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para registrar una mascota');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Upload photo if exists
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }
      
      // Create pet record
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .insert([
          {
            owner_id: user.id,
            name: formData.name,
            species: formData.species,
            breed: formData.breed,
            color: formData.color,
            size: formData.size,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            birth_date: formData.birth_date || null,
            gender: formData.gender,
            special_needs: formData.special_needs || null,
            medical_conditions: formData.medical_conditions || null,
            photo_url: photoUrl
          }
        ])
        .select()
        .single();
        
      if (petError) throw petError;
      
      // If QR code ID is provided, update the QR code to link it with the pet
      if (qrCodeId && pet) {
        const { error: qrError } = await supabase
          .from('qr_codes')
          .update({ 
            pet_id: pet.id,
            owner_id: user.id,
            status: 'active',
            activation_date: new Date().toISOString()
          })
          .eq('id', qrCodeId);
          
        if (qrError) {
          console.error('Error updating QR code:', qrError);
          // Continue anyway as the pet was created successfully
        }
      }
      
      setSuccess(true);
      
      // Redirigir a la página de suscripción
      if (pet && qrCodeId) {
        navigate(`/suscripcion?petId=${pet.id}&qrId=${qrCodeId}`);
      } else if (onComplete && pet) {
        onComplete(pet.id);
      } else {
        // Navigate to dashboard after a delay
        setTimeout(() => {
          navigate('/mi-cuenta');
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('Error registering pet:', err);
      setError(err.message || 'Error al registrar la mascota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Registra a tu mascota</h2>
        <p className="mt-2 text-gray-600">
          Completa la información para crear el perfil de tu mascota
        </p>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">¡Mascota registrada con éxito!</h3>
          <p className="text-green-700 mb-4">
            El perfil de tu mascota ha sido creado correctamente.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      ) : (
        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Foto de la mascota */}
          <div className="flex flex-col items-center justify-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de tu mascota
            </label>
            <div className="mt-1 flex flex-col items-center">
              <div className="w-32 h-32 border-2 border-gray-300 border-dashed rounded-full flex items-center justify-center overflow-hidden relative">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Vista previa" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <button
                type="button"
                className="mt-2 flex items-center text-sm text-green-600 hover:text-green-500"
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Subir foto
              </button>
            </div>
          </div>

          {/* Información básica */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-green-600" />
              Información básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la mascota *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Luna"
                />
              </div>

              <div>
                <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">
                  Especie *
                </label>
                <div className="relative">
                  <select
                    id="species"
                    name="species"
                    required
                    value={formData.species}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
                  >
                    <option value="dog">Perro</option>
                    <option value="cat">Gato</option>
                    <option value="other">Otro</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
                  Raza (opcional)
                </label>
                <input
                  id="breed"
                  name="breed"
                  type="text"
                  value={formData.breed}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Golden Retriever"
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Color (opcional)
                </label>
                <input
                  id="color"
                  name="color"
                  type="text"
                  value={formData.color}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Dorado"
                />
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño (opcional)
                </label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
                >
                  <option value="small">Pequeño</option>
                  <option value="medium">Mediano</option>
                  <option value="large">Grande</option>
                </select>
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg) (opcional)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: 15.5"
                />
              </div>

              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de nacimiento (opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Género
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
                >
                  <option value="male">Macho</option>
                  <option value="female">Hembra</option>
                  <option value="unknown">No especificado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-green-600" />
              Información adicional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


              <div className="md:col-span-2">
                <label htmlFor="special_needs" className="block text-sm font-medium text-gray-700 mb-2">
                  Necesidades especiales (opcional)
                </label>
                <textarea
                  id="special_needs"
                  name="special_needs"
                  rows={2}
                  value={formData.special_needs}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Dieta especial, medicación regular, etc."
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700 mb-2">
                  Condiciones médicas (opcional)
                </label>
                <textarea
                  id="medical_conditions"
                  name="medical_conditions"
                  rows={2}
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Alergias, condiciones crónicas, etc."
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando mascota...
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar mascota
                </div>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PetRegistrationForm;