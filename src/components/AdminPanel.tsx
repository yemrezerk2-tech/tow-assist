'use client'
import ServiceAreasInput from '@/components/ServiceAreasInput'
import AdminAddressInput from '@/components/AdminAddressInput'
import WorkingHoursInput from '@/components/WorkingHoursInput'
import { useState, useEffect, useCallback } from 'react'
import { Driver, Location, WorkingHours } from '@/types'
import { 
  Plus, Trash2, Edit, Save, X, Car, Phone, MapPin, Euro, 
  LogOut, Users, ClipboardList, RefreshCw, Filter, Mail, MessageCircle,
  Archive, RotateCcw, FileText   
} from 'lucide-react'

function normalizeDriverPhone(phone: string): string {
  // Remove all non-digit chars except leading +
  const cleaned = phone.replace(/[^\d+]/g, '')
  // If starts with 0, assume German number → replace with +49
  if (cleaned.startsWith('0')) {
    return '+49' + cleaned.slice(1)
  }
  // If no + prefix, add it
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned
  }
  return cleaned
}

// This component handles the admin dashboard for managing drivers and job assignments
// Used by both admin users and call center operators. It's a massive component I intend to break down to smaller parts in future.
interface AdminPanelProps {
  onClose: () => void
}

interface NewDriverData {
  name: string
  phone: string
  latitude: string
  longitude: string
  description: string
  vehicleType: string
  basePrice: string
  available: boolean
  manuallyOnline: boolean
  rating: string
  serviceAreas: string
  features: string
  maxDistance: string
  responseTime: string
  serviceType: 'towing' | 'repair' | 'both'
  workingHours: WorkingHours 
}

interface Assignment {
  id: string
  helpId: string
  driverId: string
  userLocation: Location
  userPhone?: string
  notes?: string
  status: 'pending' | 'assigned' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  driver_name?: string
  driver_phone?: string
  driver_vehicle?: string
  driver_deleted?: boolean
}

interface PartnershipRequest {
  id: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  city: string
  service_type: string
  message?: string
  status: string
  created_at: string
}

interface ContactRequest {
  id: string
  name: string
  email: string
  phone: string
  message: string
  status: string
  created_at: string
}
interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}
export default function AdminPanel({ onClose }: AdminPanelProps) {
  const handleClose = () => onClose();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [driverList, setDriverList] = useState<Driver[]>([])
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([])
  const [partnerRequests, setPartnerRequests] = useState<PartnershipRequest[]>([])
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [currentEditDriver, setCurrentEditDriver] = useState<Driver | null>(null)
  const [displayAddForm, setDisplayAddForm] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'drivers' | 'assignments' | 'partnerships' | 'contacts' | 'blog'>('drivers')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showArchivedDrivers, setShowArchivedDrivers] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);

  const [newDriverInfo, setNewDriverInfo] = useState<NewDriverData>({
    name: '',
    phone: '',
    latitude: '',
    longitude: '',
    description: '',
    vehicleType: '',
    basePrice: '',
    available: true,
    manuallyOnline: true,
    rating: '4.5',
    serviceAreas: '',
    features: '',
    maxDistance: '50',
    responseTime: '30',
    serviceType: 'towing',
    workingHours: { 
      mon: ["08:00", "20:00"],
      tue: ["08:00", "20:00"],
      wed: ["08:00", "20:00"],
      thu: ["08:00", "20:00"],
      fri: ["08:00", "20:00"],
      sat: ["09:00", "18:00"],
      sun: ["10:00", "16:00"]
    }
  })
const loadBlogPosts = useCallback(async () => {
  try {
    const response = await fetch('/api/blog?admin=true')
    if (response.ok) {
      const data = await response.json()
      setBlogPosts(data)
    }
  } catch (err) {
    console.error('Error loading blog posts:', err)
  }
}, [])
const loadDriverData = useCallback(async () => {
  try {
    setIsDataLoading(true)
    const apiUrl = showArchivedDrivers 
      ? '/api/drivers?archived_only=true'
      : '/api/drivers?include_archived=false&admin=true' 
    
    const apiResponse = await fetch(apiUrl)
    if (!apiResponse.ok) throw new Error('Failed to fetch drivers')
    const driverData = await apiResponse.json()
    setDriverList(driverData)
  } catch (err) {
    console.error('Error loading driver information:', err)
    alert('Fehler beim Laden der Fahrerdaten')
  } finally {
    setIsDataLoading(false)
  }
}, [showArchivedDrivers])

  const loadAssignmentData = useCallback(async () => {
    try {
      const apiUrl = statusFilter !== 'all' 
        ? `/api/assignments?status=${statusFilter}`
        : '/api/assignments'
        
      const response = await fetch(apiUrl)
      if (response.ok) {
        const assignmentData = await response.json()
        setAssignmentList(assignmentData)
      }
    } catch (err) {
      console.error('Error loading assignment data:', err)
      alert('Fehler beim Laden der Einsatzdaten')
    }
  }, [statusFilter])

  const loadPartnershipData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/partnership-requests')
      if (response.ok) {
        const partnershipData = await response.json()
        setPartnerRequests(partnershipData)
      }
    } catch (err) {
      console.error('Error loading partnership requests:', err)
    }
  }, [])

  const loadContactData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/contact-requests')
      if (response.ok) {
        const contactData = await response.json()
        setContactRequests(contactData)
      }
    } catch (err) {
      console.error('Error loading contact requests:', err)
    }
  }, [])

  useEffect(() => {
    loadDriverData()
    loadAssignmentData() 
    loadPartnershipData()
    loadContactData()
    loadBlogPosts()
  }, [refreshTrigger, showArchivedDrivers, loadDriverData, loadAssignmentData, loadPartnershipData, loadContactData, loadBlogPosts])

  // Function to restore archived driver back to active status
  const handleDriverRestore = async (driverId: string) => {
    if (!confirm('Möchten Sie diesen Fahrer wirklich wiederherstellen?\n\nDer Fahrer wird wieder in der aktiven Liste angezeigt und kann neuen Einsätzen zugewiesen werden.')) return

    try {
      const response = await fetch(`/api/drivers/${driverId}/restore`, {
        method: 'PUT'
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to restore driver')
      }

      setRefreshTrigger(prev => prev + 1)
      alert(`Fahrer "${responseData.driverName}" erfolgreich wiederhergestellt!`)
    } catch (err) {
      console.error('Error restoring driver:', err)
      alert('Fehler beim Wiederherstellen des Fahrers: ' + (err as Error).message)
    }
  }

const processWorkingHours = (hoursInput: unknown): WorkingHours => {
  if (!hoursInput) {
    return {
      mon: ["08:00", "20:00"],
      tue: ["08:00", "20:00"],
      wed: ["08:00", "20:00"],
      thu: ["08:00", "20:00"],
      fri: ["08:00", "20:00"],
      sat: ["09:00", "18:00"],
      sun: ["10:00", "16:00"]
    }
  }
  

  if (typeof hoursInput === 'string') {
    try {

      if (hoursInput.trim().startsWith('{') || hoursInput.trim().startsWith('[')) {
        const parsedData = JSON.parse(hoursInput)
        return parsedData as WorkingHours
      }

      if (hoursInput.trim() === '24/7' || hoursInput.trim() === '24&#x2F;7') {
        return '24/7'
      }

      return {
        mon: ["08:00", "20:00"],
        tue: ["08:00", "20:00"],
        wed: ["08:00", "20:00"],
        thu: ["08:00", "20:00"],
        fri: ["08:00", "20:00"],
        sat: ["09:00", "18:00"],
        sun: ["10:00", "16:00"]
      }
    } catch (parseError) {
      console.error('Error parsing working hours string:', parseError)
      return {
        mon: ["08:00", "20:00"],
        tue: ["08:00", "20:00"],
        wed: ["08:00", "20:00"],
        thu: ["08:00", "20:00"],
        fri: ["08:00", "20:00"],
        sat: ["09:00", "18:00"],
        sun: ["10:00", "16:00"]
      }
    }
  }

  if (typeof hoursInput === 'object' && hoursInput !== null && !Array.isArray(hoursInput)) {
    return hoursInput as WorkingHours
  }

  return {
    mon: ["08:00", "20:00"],
    tue: ["08:00", "20:00"],
    wed: ["08:00", "20:00"],
    thu: ["08:00", "20:00"],
    fri: ["08:00", "20:00"],
    sat: ["09:00", "18:00"],
    sun: ["10:00", "16:00"]
  }
}

  const handleNewDriverLocationChange = (locationData: { address: string; latitude: number; longitude: number }) => {
    setNewDriverInfo({
      ...newDriverInfo,
      latitude: locationData.latitude.toString(),
      longitude: locationData.longitude.toString()
    })
  }

  const handleEditDriverLocationChange = (locationData: { address: string; latitude: number; longitude: number }) => {
    if (currentEditDriver) {
      setCurrentEditDriver({
        ...currentEditDriver,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      })
    }
  }

  const processNewDriverSubmission = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault()

    if (!newDriverInfo.latitude || !newDriverInfo.longitude) {
      alert('Bitte wählen Sie einen Standort für den Fahrer aus.')
      return
    }

    try {
      const driverPayload = {
        name: newDriverInfo.name,
        phone: normalizeDriverPhone(newDriverInfo.phone),
        latitude: parseFloat(newDriverInfo.latitude),
        longitude: parseFloat(newDriverInfo.longitude),
        description: newDriverInfo.description,
        vehicle_type: newDriverInfo.vehicleType,
        base_price: parseInt(newDriverInfo.basePrice) || 0,
        available: newDriverInfo.available,
        manuallyOnline: newDriverInfo.manuallyOnline,
        rating: parseFloat(newDriverInfo.rating) || 4.5,
        serviceAreas: newDriverInfo.serviceAreas.split(',').map(area => area.trim()).filter(Boolean),
        features: newDriverInfo.features.split(',').map(feature => feature.trim()).filter(Boolean),
        maxDistance: parseInt(newDriverInfo.maxDistance) || 50,
        responseTime: parseInt(newDriverInfo.responseTime) || 30,
        serviceType: newDriverInfo.serviceType,
        workingHours: newDriverInfo.workingHours 
      }

      const apiResponse = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverPayload)
      })

      if (!apiResponse.ok) {
        const errorInfo = await apiResponse.json()
        throw new Error(errorInfo.error || 'Failed to create driver')
      }

      // Reset form to initial state
      setNewDriverInfo({
        name: '',
        phone: '',
        latitude: '',
        longitude: '',
        description: '',
        vehicleType: '',
        basePrice: '',
        available: true,
        manuallyOnline: true,
        rating: '4.5',
        serviceAreas: '',
        features: '',
        maxDistance: '50',
        responseTime: '30',
        serviceType: 'towing',
        workingHours: { 
          mon: ["08:00", "20:00"],
          tue: ["08:00", "20:00"],
          wed: ["08:00", "20:00"],
          thu: ["08:00", "20:00"],
          fri: ["08:00", "20:00"],
          sat: ["09:00", "18:00"],
          sun: ["10:00", "16:00"]
        }
      })
      setDisplayAddForm(false)
      setRefreshTrigger(prev => prev + 1)
      alert('Fahrer erfolgreich hinzugefügt!')
    } catch (err) {
      console.error('Error adding new driver:', err)
      alert('Fehler beim Hinzufügen des Fahrers')
    }
  }

  const processDriverDeletion = async (driverId: string) => {
    if (!confirm('Möchten Sie diesen Fahrer wirklich archivieren?\n\nDer Fahrer wird nicht mehr in der aktiven Liste angezeigt, kann aber später wiederhergestellt werden.')) return

    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE'
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.activeAssignments) {
          alert(`Archivierung nicht möglich: ${responseData.error}\n\nAktive Einsätze: ${responseData.activeAssignments}\nHilfe-IDs: ${responseData.assignmentHelpIds}`)
        } else {
          throw new Error(responseData.error || 'Failed to archive driver')
        }
        return
      }

      setRefreshTrigger(prev => prev + 1)
      alert(`Fahrer "${responseData.driverName}" erfolgreich archiviert!`)
    } catch (err) {
      console.error('Error archiving driver:', err)
      alert('Fehler beim Archivieren des Fahrers: ' + (err as Error).message)
    }
  }

  const processDriverUpdate = async (updateEvent: React.FormEvent) => {
    updateEvent.preventDefault()
    if (!currentEditDriver) return

    try {
      const updatePayload = {
        name: currentEditDriver.name,
        phone: normalizeDriverPhone(currentEditDriver.phone),
        latitude: currentEditDriver.latitude,
        longitude: currentEditDriver.longitude,
        description: currentEditDriver.description,
        vehicle_type: currentEditDriver.vehicleType,
        base_price: currentEditDriver.basePrice,
        available: currentEditDriver.available,
        manuallyOnline: currentEditDriver.manuallyOnline,
        rating: currentEditDriver.rating,
        serviceAreas: currentEditDriver.serviceAreas || [],
        features: currentEditDriver.features || [],
        maxDistance: currentEditDriver.maxDistance || 50,
        responseTime: currentEditDriver.responseTime || 30,
        serviceType: currentEditDriver.serviceType,
        workingHours: currentEditDriver.workingHours
      }

      const response = await fetch(`/api/drivers/${currentEditDriver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      })

      if (!response.ok) throw new Error('Failed to update driver')

      setCurrentEditDriver(null)
      setRefreshTrigger(prev => prev + 1)
      alert('Fahrer erfolgreich aktualisiert!')
    } catch (err) {
      console.error('Error updating driver information:', err)
      alert('Fehler beim Aktualisieren des Fahrers')
    }
  }

  const modifyAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update assignment')

      setRefreshTrigger(prev => prev + 1)
      alert('Einsatzstatus erfolgreich aktualisiert!')
    } catch (err) {
      console.error('Error updating assignment status:', err)
      alert('Fehler beim Aktualisieren des Einsatzstatus')
    }
  }

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm('Möchten Sie diesen Einsatz wirklich löschen?')) return

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete assignment')

      setRefreshTrigger(prev => prev + 1)
      alert('Einsatz erfolgreich gelöscht!')
    } catch (err) {
      console.error('Error deleting assignment:', err)
      alert('Fehler beim Löschen des Einsatzes')
    }
  }

  const modifyRequestStatus = async (requestType: 'partnership' | 'contact', requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/${requestType}-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update request status')

      setRefreshTrigger(prev => prev + 1)
      alert('Status erfolgreich aktualisiert!')
    } catch (err) {
      console.error('Error updating request status:', err)
      alert('Fehler beim Aktualisieren des Status')
    }
  }

  const handleDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleUserLogout = () => {
    sessionStorage.removeItem('admin-authenticated')
    sessionStorage.removeItem('admin-auth-time')
    handleClose();
    window.location.href = '/admin/login'
  }

  const getFilteredAssignments = assignmentList.filter(assignment => {
    if (statusFilter === 'all') return true
    return assignment.status === statusFilter
  })

  const determineStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const translateStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ausstehend'
      case 'assigned': return 'Zugewiesen'
      case 'completed': return 'Abgeschlossen'
      case 'cancelled': return 'Storniert'
      default: return status
    }
  }

  const translateServiceType = (serviceType: string) => {
    switch (serviceType) {
      case 'towing': return 'Abschleppdienst'
      case 'repair': return 'Pannenhilfe'
      case 'both': return 'Beides'
      default: return serviceType
    }
  }

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'towing': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'repair': return 'bg-green-100 text-green-800 border-green-300'
      case 'both': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

const displayWorkingHours = (workingHours: unknown): string => {
  if (!workingHours) {
    return 'Keine Arbeitszeiten festgelegt'
  }
  
  const processedHours = processWorkingHours(workingHours)
  
  if (!processedHours) {
    return 'Ungültige Arbeitszeiten'
  }
  
  if (typeof processedHours === 'string') {
    // Handle the HTML-encoded version and the normal version
    return processedHours === '24/7' || processedHours === '24&#x2F;7' 
      ? '24/7 verfügbar' 
      : processedHours
  }
  
  if (typeof processedHours !== 'object' || Array.isArray(processedHours)) {
    return 'Ungültiges Arbeitszeiten-Format'
  }
  
  const dayLabels: { [key: string]: string } = {
    mon: 'Mo',
    tue: 'Di', 
    wed: 'Mi',
    thu: 'Do',
    fri: 'Fr',
    sat: 'Sa',
    sun: 'So'
  }
  
  try {
    const formattedSchedule = Object.entries(processedHours)
      .map(([dayKey, timeSlots]) => {
        const dayLabel = dayLabels[dayKey] || dayKey

        if (typeof timeSlots === 'string' && (timeSlots === '24/7' || timeSlots === '24&#x2F;7')) {
          return `${dayLabel}: 24/7`
        }

        if (Array.isArray(timeSlots)) {
          return `${dayLabel}: ${timeSlots[0]} - ${timeSlots[1]}`
        }
        
        if (typeof timeSlots === 'string') {
          return `${dayLabel}: ${timeSlots}`
        }
        
        return `${dayLabel}: ${String(timeSlots)}`
      })
      .join(', ')
    
    return formattedSchedule
  } catch (formatError) {
    console.error('Error formatting working hours:', formatError)
    return 'Fehler beim Formatieren der Arbeitszeiten'
  }
}
  const switchDriverOnlineStatus = async (targetDriver: Driver) => {
    try {
      const updatedOnlineStatus = !targetDriver.manuallyOnline
      
      const statusUpdatePayload = {
        name: targetDriver.name,
        phone: targetDriver.phone,
        latitude: targetDriver.latitude,
        longitude: targetDriver.longitude,
        description: targetDriver.description,
        vehicle_type: targetDriver.vehicleType,
        base_price: targetDriver.basePrice,
        available: targetDriver.available,
        rating: targetDriver.rating,
        serviceAreas: targetDriver.serviceAreas || [],
        features: targetDriver.features || [],
        maxDistance: targetDriver.maxDistance || 50,
        responseTime: targetDriver.responseTime || 30,
        serviceType: targetDriver.serviceType,
        manuallyOnline: updatedOnlineStatus,
        workingHours: targetDriver.workingHours
      }
      
      const response = await fetch(`/api/drivers/${targetDriver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdatePayload)
      })

      if (!response.ok) {
        throw new Error('Failed to update driver status')
      }

      setRefreshTrigger(prev => prev + 1)
      alert(`Fahrer wurde ${updatedOnlineStatus ? 'online' : 'offline'} geschaltet!`)
    } catch (err) {
      console.error('Error updating driver online status:', err)
      alert('Fehler beim Aktualisieren des Fahrerstatus')
    }
  }

  // Categorize drivers based on their status and archive state
  const activeDriversList = driverList.filter(driver => !driver.archived)
  const archivedDriversList = driverList.filter(driver => driver.archived)
  const onlineActiveDrivers = activeDriversList.filter(driver => driver.manuallyOnline)
  const offlineActiveDrivers = activeDriversList.filter(driver => !driver.manuallyOnline)

  if (isDataLoading && driverList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Daten...</p>
        </div>
      </div>
    )
  }

  const renderDriverCard = (driver: Driver) => (
    <div
      key={driver.id}
      className={`pro-card rounded-2xl p-6 border-4 hover-lift transition-all duration-300 ${
        driver.archived 
          ? 'border-gray-400 bg-gray-50' 
          : 'border-yellow-500'
      }`}
    >
      {currentEditDriver?.id === driver.id ? (
        <form onSubmit={processDriverUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={currentEditDriver.name}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, name: e.target.value } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
              <input
                type="tel"
                value={currentEditDriver.phone}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, phone: e.target.value } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fahrzeugtyp *</label>
              <input
                type="text"
                value={currentEditDriver.vehicleType}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, vehicleType: e.target.value } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Typ *</label>
              <select
                value={currentEditDriver.serviceType}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, serviceType: e.target.value as 'towing' | 'repair' | 'both' } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                required
              >
                <option value="towing">Abschleppdienst</option>
                <option value="repair">Pannenhilfe</option>
                <option value="both">Beides</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Standort *</label>
              <AdminAddressInput
                onLocationSelect={handleEditDriverLocationChange}
              />
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">Aktuelle Koordinaten:</span><br />
                Breitengrad: {currentEditDriver.latitude?.toFixed(6)}<br />
                Längengrad: {currentEditDriver.longitude?.toFixed(6)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basispreis (€) *</label>
              <input
                type="number"
                value={currentEditDriver.basePrice}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, basePrice: parseInt(e.target.value) } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicegebiete</label>
              <input
                type="text"
                value={(currentEditDriver.serviceAreas || []).join(', ')}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, serviceAreas: e.target.value.split(',').map(s => s.trim()) } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                placeholder="Hamburg-Mitte, Altstadt, Neustadt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leistungen</label>
              <ServiceAreasInput
                value={newDriverInfo.serviceAreas.split(',').map(s => s.trim()).filter(Boolean)}
                onChange={(areas) => setNewDriverInfo({ ...newDriverInfo, serviceAreas: areas.join(', ') })}
                placeholder="Stadt oder Ort eingeben..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bewertung</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={currentEditDriver.rating}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, rating: parseFloat(e.target.value) } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Entfernung (km)</label>
              <input
                type="number"
                value={currentEditDriver.maxDistance || 50}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, maxDistance: parseInt(e.target.value) } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Antwortzeit (min)</label>
              <input
                type="number"
                value={currentEditDriver.responseTime || 30}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, responseTime: parseInt(e.target.value) } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              value={currentEditDriver.description}
              onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, description: e.target.value } : null)}
              rows={3}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
            />
          </div>

          {/*Working Hours UI Component for Edit Form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arbeitszeiten</label>
            <WorkingHoursInput
              value={currentEditDriver.workingHours || {}}
              onChange={(hours) => setCurrentEditDriver({
                ...currentEditDriver,
                workingHours: hours
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl">
              <input
                type="checkbox"
                id={`available-${driver.id}`}
                checked={currentEditDriver.available}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, available: e.target.checked } : null)}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label htmlFor={`available-${driver.id}`} className="text-sm font-medium text-gray-700">
                Fahrer ist verfügbar
              </label>
            </div>
            <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl">
              <input
                type="checkbox"
                id={`manuallyOnline-${driver.id}`}
                checked={currentEditDriver.manuallyOnline}
                onChange={(e) => setCurrentEditDriver(currentEditDriver ? { ...currentEditDriver, manuallyOnline: e.target.checked } : null)}
                className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor={`manuallyOnline-${driver.id}`} className="text-sm font-medium text-gray-700">
                Manuell online geschaltet
              </label>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              className="road-sign px-6 py-2 font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105"
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setCurrentEditDriver(null)}
              className="pro-card border-2 border-gray-300 px-6 py-2 font-semibold text-gray-700 rounded-xl hover:border-red-500 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                driver.archived ? 'bg-gray-400' : 'road-sign'
              }`}>
                <Car className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {driver.archived && '📁 '}{driver.name}
                  {driver.archived && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Archiviert)
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-semibold">{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <Euro className="w-4 h-4" />
                    <span className="text-sm font-semibold">Ab {driver.basePrice}€</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <StarIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{driver.rating}/5</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{driver.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm mb-3">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Car className="w-4 h-4" />
                <span>{driver.vehicleType}</span>
              </div>
              {!driver.archived && (
                <div className={`flex items-center gap-2 ${driver.available && driver.manuallyOnline ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${driver.available && driver.manuallyOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-semibold">{driver.available && driver.manuallyOnline ? 'Aktiv' : 'Inaktiv'}</span>
                </div>
              )}
              <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getServiceTypeColor(driver.serviceType)}`}>
                {translateServiceType(driver.serviceType)}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-3">
              <strong>Arbeitszeiten:</strong> {displayWorkingHours(driver.workingHours)}
            </div>

            {driver.archived && driver.archivedAt && (
              <div className="text-sm text-gray-500 mb-3">
                <strong>Archiviert am:</strong> {new Date(driver.archivedAt).toLocaleDateString('de-DE')}
              </div>
            )}

            {driver.serviceAreas && driver.serviceAreas.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gray-500">Servicegebiete: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {driver.serviceAreas.map((area) => (
                    <span key={area} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {driver.features && driver.features.length > 0 && (
              <div>
                <span className="text-xs text-gray-500">Leistungen: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {driver.features.map((feature) => (
                    <span key={feature} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {driver.archived ? (
              // Actions for archived drivers
              <>
                <button
                  onClick={() => handleDriverRestore(driver.id)}
                  className="pro-card border-2 border-green-500 px-4 py-2 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Wiederherstellen
                </button>
              </>
            ) : (
              // Actions for active drivers
              <>
                <button
                  onClick={() => setCurrentEditDriver(driver)}
                  className="pro-card border-2 border-yellow-500 px-4 py-2 text-yellow-600 font-semibold rounded-xl hover:bg-yellow-50 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => switchDriverOnlineStatus(driver)}
                  className={`px-4 py-2 font-semibold rounded-xl transition-colors flex items-center gap-2 ${
                    driver.manuallyOnline
                      ? 'pro-card border-2 border-red-500 text-red-600 hover:bg-red-50'
                      : 'pro-card border-2 border-green-500 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {driver.manuallyOnline ? 'Offline schalten' : 'Online schalten'}
                </button>
                <button
                  onClick={() => processDriverDeletion(driver.id)}
                  className="pro-card border-2 border-gray-500 px-4 py-2 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archivieren
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Verwalten Sie Ihre Fahrer, Einsätze und Anfragen</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDataRefresh}
              className="pro-card border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700 rounded-xl hover:border-blue-500 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </button>
            {!showArchivedDrivers && (
              <button
                onClick={() => setDisplayAddForm(true)}
                className="road-sign px-4 py-2 font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neuer Fahrer
              </button>
            )}
            <button
              onClick={handleUserLogout}
              className="pro-card border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700 rounded-xl hover:border-red-500 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="pro-card rounded-xl p-6 text-center hover-lift">
            <div className="text-3xl font-black text-blue-600 mb-2">
              {showArchivedDrivers ? archivedDriversList.length : activeDriversList.length}
            </div>
            <div className="text-gray-600">{showArchivedDrivers ? 'Archivierte Fahrer' : 'Aktive Fahrer'}</div>
          </div>
          <div className="pro-card rounded-xl p-6 text-center hover-lift">
            <div className="text-3xl font-black text-green-600 mb-2">
              {showArchivedDrivers ? '-' : onlineActiveDrivers.filter(driver => driver.available).length}
            </div>
            <div className="text-gray-600">{showArchivedDrivers ? 'Archiviert' : 'Aktive Fahrer'}</div>
          </div>
          <div className="pro-card rounded-xl p-6 text-center hover-lift">
            <div className="text-3xl font-black text-yellow-600 mb-2">
              {assignmentList.filter(assignment => assignment.status === 'pending').length}
            </div>
            <div className="text-gray-600">Ausstehende Einsätze</div>
          </div>
          <div className="pro-card rounded-xl p-6 text-center hover-lift">
            <div className="text-3xl font-black text-purple-600 mb-2">
              {partnerRequests.length + contactRequests.length}
            </div>
            <div className="text-gray-600">Neue Anfragen</div>
          </div>
        </div>

        {/* Toggle for archive view - only show on drivers tab */}
        {selectedTab === 'drivers' && (
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <button
              onClick={() => setShowArchivedDrivers(!showArchivedDrivers)}
              className={`px-4 py-2 font-semibold rounded-xl transition-all ${
                showArchivedDrivers
                  ? 'road-sign bg-yellow-500 text-black'
                  : 'pro-card border-2 border-gray-300 text-gray-700 hover:border-yellow-500'
              }`}
            >
              {showArchivedDrivers ? '📁 Archivierte Fahrer' : '👥 Aktive Fahrer'}
            </button>
            
            {showArchivedDrivers && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-xl">
                <span className="font-semibold">{archivedDriversList.length} archivierte Fahrer</span>
              </div>
            )}

            {!showArchivedDrivers && archivedDriversList.length > 0 && (
              <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded-xl">
                <span className="font-semibold">{archivedDriversList.length} Fahrer im Archiv verfügbar</span>
              </div>
            )}
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setSelectedTab('drivers')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
              selectedTab === 'drivers' 
                ? 'border-yellow-500 text-yellow-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Fahrer ({showArchivedDrivers ? archivedDriversList.length : activeDriversList.length})
          </button>
          <button
            onClick={() => setSelectedTab('blog')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
              selectedTab === 'blog' 
                ? 'border-yellow-500 text-yellow-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Blog ({blogPosts.length})
          </button>
          <button
            onClick={() => setSelectedTab('assignments')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
              selectedTab === 'assignments' 
                ? 'border-yellow-500 text-yellow-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Einsätze ({assignmentList.length})
          </button>
          <button
            onClick={() => setSelectedTab('partnerships')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
              selectedTab === 'partnerships' 
                ? 'border-yellow-500 text-yellow-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            Partner ({partnerRequests.length})
          </button>
          <button
            onClick={() => setSelectedTab('contacts')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
              selectedTab === 'contacts' 
                ? 'border-yellow-500 text-yellow-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Kontakte ({contactRequests.length})
          </button>
          
        </div>
              
        {selectedTab === 'drivers' && (
          <div className="space-y-8">
            {showArchivedDrivers ? (
              // View for archived drivers
              <>
                {archivedDriversList.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <h2 className="text-2xl font-bold text-gray-700">Archivierte Fahrer</h2>
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {archivedDriversList.length} archiviert
                      </span>
                    </div>
                    <div className="space-y-4">
                      {archivedDriversList.map(renderDriverCard)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center pro-card rounded-2xl p-12 border-4 border-gray-400">
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Archive className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Keine archivierten Fahrer</h3>
                    <p className="text-gray-600 mb-6">
                      Es wurden noch keine Fahrer archiviert.
                    </p>
                    <button
                      onClick={() => setShowArchivedDrivers(false)}
                      className="road-sign px-8 py-3 font-semibold transition-all duration-300 hover:scale-105"
                    >
                      Zu aktiven Fahrern wechseln
                    </button>
                  </div>
                )}
              </>
            ) : (
              // View for active drivers
              <>
                {onlineActiveDrivers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h2 className="text-2xl font-bold text-green-700">Online Fahrer</h2>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {onlineActiveDrivers.length} online geschaltet
                      </span>
                    </div>
                    <div className="space-y-4">
                      {onlineActiveDrivers.map(renderDriverCard)}
                    </div>
                  </div>
                )}

                {offlineActiveDrivers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h2 className="text-2xl font-bold text-red-700">Offline Fahrer</h2>
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {offlineActiveDrivers.length} offline geschaltet
                      </span>
                    </div>
                    <div className="space-y-4">
                      {offlineActiveDrivers.map(renderDriverCard)}
                    </div>
                  </div>
                )}

                {activeDriversList.length === 0 && (
                  <div className="text-center pro-card rounded-2xl p-12 border-4 border-yellow-500">
                    <div className="w-16 h-16 road-sign rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Keine aktiven Fahrer vorhanden</h3>
                    <p className="text-gray-600 mb-6">
                      {archivedDriversList.length > 0 
                        ? 'Alle Fahrer sind archiviert. Sie können sie im Archiv wiederherstellen.'
                        : 'Fügen Sie Ihren ersten Fahrer hinzu, um zu beginnen.'
                      }
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setDisplayAddForm(true)}
                        className="road-sign px-8 py-3 font-semibold transition-all duration-300 hover:scale-105"
                      >
                        Ersten Fahrer hinzufügen
                      </button>
                      {archivedDriversList.length > 0 && (
                        <button
                          onClick={() => setShowArchivedDrivers(true)}
                          className="pro-card border-2 border-gray-400 px-8 py-3 font-semibold text-gray-700 rounded-xl hover:border-yellow-500 transition-colors"
                        >
                          Archiv durchsuchen ({archivedDriversList.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}


        {selectedTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Status:</span>
              </div>
              {['all', 'pending', 'assigned', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    statusFilter === status
                      ? 'road-sign'
                      : 'pro-card border-2 border-gray-300 text-gray-700 hover:border-yellow-500'
                  }`}
                >
                  {status === 'all' ? 'Alle' : translateStatusText(status)}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {getFilteredAssignments.map((assignment) => (
                <div key={assignment.id} className="pro-card rounded-2xl p-6 border-4 border-blue-500">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${determineStatusColor(assignment.status)}`}>
                          {translateStatusText(assignment.status)}
                        </div>
                        {assignment.driver_deleted && (
                          <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-lg border border-red-300">
                            DRIVER DELETED
                          </div>
                        )}
                        <span className="font-mono font-bold text-gray-900">{assignment.helpId}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(assignment.createdAt).toLocaleString('de-DE')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Kundeninformation</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Standort:</span> {assignment.userLocation?.address}</p>
                            {assignment.userPhone && (
                              <p><span className="font-medium">Telefon:</span> {assignment.userPhone}</p>
                            )}
                            {assignment.notes && (
                              <p><span className="font-medium">Notizen:</span> {assignment.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Fahrerinformation</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Name:</span> {assignment.driver_name}</p>
                            <p><span className="font-medium">Telefon:</span> {assignment.driver_phone}</p>
                            <p><span className="font-medium">Fahrzeug:</span> {assignment.driver_vehicle}</p>
                            {assignment.driver_deleted && (
                              <p className="text-red-600 text-xs font-semibold">
                                Dieser Fahrer wurde gelöscht
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <div className="flex gap-2">
                        {assignment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => modifyAssignmentStatus(assignment.id, 'assigned')}
                              className="flex-1 pro-card border-2 border-green-500 px-3 py-2 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors text-sm"
                            >
                              Zuweisen
                            </button>
                            <button
                              onClick={() => modifyAssignmentStatus(assignment.id, 'cancelled')}
                              className="flex-1 pro-card border-2 border-red-500 px-3 py-2 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors text-sm"
                            >
                              Stornieren
                            </button>
                          </>
                        )}
                        {assignment.status === 'assigned' && (
                          <button
                            onClick={() => modifyAssignmentStatus(assignment.id, 'completed')}
                            className="flex-1 pro-card border-2 border-blue-500 px-3 py-2 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm"
                          >
                            Abschließen
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => removeAssignment(assignment.id)}
                        className="w-full pro-card border-2 border-gray-400 px-3 py-2 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredAssignments.length === 0 && (
                <div className="text-center pro-card rounded-2xl p-12 border-4 border-blue-500">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Einsätze vorhanden</h3>
                  <p className="text-gray-600">
                    {statusFilter === 'all' 
                      ? 'Noch wurden keine Hilfeanfragen erstellt.'
                      : `Keine Einsätze mit Status "${translateStatusText(statusFilter)}" gefunden.`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'partnerships' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Partnerschaftsanfragen</span>
              </div>
            </div>

            <div className="space-y-4">
              {partnerRequests.map((request) => (
                <div key={request.id} className="pro-card rounded-2xl p-6 border-4 border-green-500">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${determineStatusColor(request.status)}`}>
                          {translateStatusText(request.status)}
                        </div>
                        <span className="font-bold text-gray-900">{request.company_name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleString('de-DE')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Unternehmensinformation</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Firmenname:</span> {request.company_name}</p>
                            <p><span className="font-medium">Ansprechpartner:</span> {request.contact_person}</p>
                            <p><span className="font-medium">E-Mail:</span> {request.email}</p>
                            <p><span className="font-medium">Telefon:</span> {request.phone}</p>
                            <p><span className="font-medium">Stadt:</span> {request.city}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Service Informationen</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Service-Typ:</span> {translateServiceType(request.service_type)}</p>
                            {request.message && (
                              <p><span className="font-medium">Nachricht:</span> {request.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => modifyRequestStatus('partnership', request.id, 'contacted')}
                              className="flex-1 pro-card border-2 border-green-500 px-3 py-2 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors text-sm"
                            >
                              Kontaktiert
                            </button>
                            <button
                              onClick={() => modifyRequestStatus('partnership', request.id, 'rejected')}
                              className="flex-1 pro-card border-2 border-red-500 px-3 py-2 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors text-sm"
                            >
                              Abgelehnt
                            </button>
                          </>
                        )}
                      </div>
                      <a
                        href={`mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(`Partnership Request: ${request.company_name}`)}&body=${encodeURIComponent(`Company: ${request.company_name}\nContact: ${request.contact_person}\nPhone: ${request.phone}\nService Type: ${request.service_type}\n\nOriginal Message: ${request.message || 'No additional message'}`)}`}
                        className="w-full pro-card border-2 border-blue-500 px-3 py-2 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        E-Mail senden
                      </a>
                      <a
                        href={`tel:${request.phone}`}
                        className="w-full pro-card border-2 border-green-500 px-3 py-2 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Anrufen
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {partnerRequests.length === 0 && (
                <div className="text-center pro-card rounded-2xl p-12 border-4 border-green-500">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Partnerschaftsanfragen</h3>
                  <p className="text-gray-600">
                    Noch wurden keine Partnerschaftsanfragen eingereicht.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'contacts' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Kontaktanfragen</span>
              </div>
            </div>

            <div className="space-y-4">
              {contactRequests.map((request) => (
                <div key={request.id} className="pro-card rounded-2xl p-6 border-4 border-blue-500">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${determineStatusColor(request.status)}`}>
                          {translateStatusText(request.status)}
                        </div>
                        <span className="font-bold text-gray-900">{request.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleString('de-DE')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Kontaktinformation</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Name:</span> {request.name}</p>
                            <p><span className="font-medium">E-Mail:</span> {request.email}</p>
                            <p><span className="font-medium">Telefon:</span> {request.phone}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Nachricht</h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600">{request.message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => modifyRequestStatus('contact', request.id, 'contacted')}
                              className="flex-1 pro-card border-2 border-green-500 px-3 py-2 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors text-sm"
                            >
                              Kontaktiert
                            </button>
                            <button
                              onClick={() => modifyRequestStatus('contact', request.id, 'rejected')}
                              className="flex-1 pro-card border-2 border-red-500 px-3 py-2 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors text-sm"
                            >
                              Abgelehnt
                            </button>
                          </>
                        )}
                      </div>
                      <a
                        href={`mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(`Contact Request from ${request.name}`)}&body=${encodeURIComponent(`Name: ${request.name}\nPhone: ${request.phone}\n\nMessage: ${request.message}`)}`}
                        className="w-full pro-card border-2 border-blue-500 px-3 py-2 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        E-Mail senden
                      </a>
                      <a
                        href={`tel:${request.phone}`}
                        className="w-full pro-card border-2 border-green-500 px-3 py-2 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Anrufen
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {contactRequests.length === 0 && (
                <div className="text-center pro-card rounded-2xl p-12 border-4 border-blue-500">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Kontaktanfragen</h3>
                  <p className="text-gray-600">
                    Noch wurden keine Kontaktanfragen eingereicht.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
{selectedTab === 'blog' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Blog Beiträge</h2>
      <button
        onClick={() => {
          setEditingPost({
            id: '',
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            featured_image: '',
            published: false,
            published_at: null,
            created_at: '',
            updated_at: ''
          });
          setShowBlogForm(true);
        }}
        className="road-sign px-4 py-2 font-semibold flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Neuer Beitrag
      </button>
    </div>

    {blogPosts.map(post => (
      <div key={post.id} className="pro-card rounded-2xl p-4 border-2 border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{post.title}</h3>
            <p className="text-sm text-gray-600">{post.excerpt}</p>
            <div className="mt-2 text-xs">
              Status: {post.published ? 'Veröffentlicht' : 'Entwurf'} | 
              Slug: {post.slug}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingPost(post);
                setShowBlogForm(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                if (!confirm('Beitrag löschen?')) return;
                try {
                  const res = await fetch(`/api/blog/${post.id}`, {
                    method: 'DELETE',
                  });
                  if (res.ok) {
                    setRefreshTrigger((prev: number) => prev + 1);
                    alert('Beitrag gelöscht');
                  } else {
                    alert('Fehler beim Löschen');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Fehler beim Löschen');
                }
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    ))}

    {blogPosts.length === 0 && (
      <div className="text-center pro-card rounded-2xl p-12 border-4 border-gray-400">
        <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Blog Beiträge</h3>
        <p className="text-gray-600 mb-6">
          Erstellen Sie Ihren ersten Blog Beitrag.
        </p>
      </div>
    )}

    {/* Blog Post Form Modal */}
    {showBlogForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingPost?.id ? 'Beitrag bearbeiten' : 'Neuen Beitrag erstellen'}
            </h3>
            <button
              onClick={() => setShowBlogForm(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editingPost) return;
              
              // Auto-generate slug from title if empty
              const slug = editingPost.slug || editingPost.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

              const postData = {
                ...editingPost,
                slug,
              };

              try {
                const url = editingPost.id
                  ? `/api/blog/${editingPost.id}`
                  : '/api/blog';
                const method = editingPost.id ? 'PUT' : 'POST';

                const res = await fetch(url, {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(postData),
                });

                if (res.ok) {
                  setShowBlogForm(false);
                  setEditingPost(null);
                  setRefreshTrigger((prev: number) => prev + 1);
                  alert(editingPost.id ? 'Beitrag aktualisiert' : 'Beitrag erstellt');
                } else {
                  const error = await res.json();
                  alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`);
                }
              } catch (err) {
                console.error(err);
                alert('Fehler beim Speichern');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel *
              </label>
              <input
                type="text"
                required
                value={editingPost?.title || ''}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL-Pfad)
              </label>
              <input
                type="text"
                value={editingPost?.slug || ''}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, slug: e.target.value } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                placeholder="wird automatisch aus Titel generiert"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wenn leer, wird der Slug automatisch aus dem Titel erstellt.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kurzbeschreibung (Excerpt)
              </label>
              <textarea
                value={editingPost?.excerpt || ''}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
                rows={2}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inhalt *
              </label>
              <textarea
                required
                value={editingPost?.content || ''}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, content: e.target.value } : null)}
                rows={6}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 font-mono"
                placeholder="HTML wird unterstützt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bild-URL (optional)
              </label>
              <input
                type="url"
                value={editingPost?.featured_image || ''}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, featured_image: e.target.value } : null)}
                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl">
              <input
                type="checkbox"
                id="published"
                checked={editingPost?.published || false}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, published: e.target.checked } : null)}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700">
                Veröffentlicht
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 road-sign py-3 font-semibold transition-all duration-300 hover:scale-105"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowBlogForm(false)}
                className="flex-1 pro-card border-2 border-gray-300 py-3 font-semibold text-gray-700 rounded-xl hover:border-red-500 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
)}
        {displayAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Neuen Fahrer hinzufügen</h3>
                <button
                  onClick={() => setDisplayAddForm(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={processNewDriverSubmission} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDriverInfo.name}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, name: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="Hans Müller"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newDriverInfo.phone}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, phone: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="+49 40 12345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fahrzeugtyp *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDriverInfo.vehicleType}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, vehicleType: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="Abschleppwagen LKW"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Typ *
                    </label>
                    <select
                      required
                      value={newDriverInfo.serviceType}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, serviceType: e.target.value as 'towing' | 'repair' | 'both' })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                    >
                      <option value="towing">Abschleppdienst</option>
                      <option value="repair">Pannenhilfe</option>
                      <option value="both">Beides</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standort *
                    </label>
                    <AdminAddressInput
                      onLocationSelect={handleNewDriverLocationChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Geben Sie die Adresse des Fahrers ein. Koordinaten werden automatisch ermittelt.
                    </p>
                    {newDriverInfo.latitude && newDriverInfo.longitude && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Ausgewählte Koordinaten:</span><br />
                        Breitengrad: {newDriverInfo.latitude}<br />
                        Längengrad: {newDriverInfo.longitude}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basispreis (€) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newDriverInfo.basePrice}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, basePrice: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="89"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bewertung
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={newDriverInfo.rating}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, rating: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="4.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max. Entfernung (km)
                    </label>
                    <input
                      type="number"
                      value={newDriverInfo.maxDistance}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, maxDistance: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Antwortzeit (min)
                    </label>
                    <input
                      type="number"
                      value={newDriverInfo.responseTime}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, responseTime: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servicegebiete
                    </label>
                    <ServiceAreasInput
                      value={newDriverInfo.serviceAreas.split(',').map(s => s.trim()).filter(Boolean)}
                      onChange={(areas) => setNewDriverInfo({ ...newDriverInfo, serviceAreas: areas.join(', ') })}
                      placeholder="Stadt oder Ort eingeben..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Durch Kommas getrennt eingeben</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leistungen
                    </label>
                    <input
                      type="text"
                      value={newDriverInfo.features}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, features: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      placeholder="24/7, Pannenhilfe, Abschleppdienst"
                    />
                    <p className="text-xs text-gray-500 mt-1">Durch Kommas getrennt eingeben</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <textarea
                    value={newDriverInfo.description}
                    onChange={(e) => setNewDriverInfo({ ...newDriverInfo, description: e.target.value })}
                    rows={3}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                    placeholder="24/7 Abschleppdienst mit modernem Equipment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arbeitszeiten</label>
                  <WorkingHoursInput
                    value={newDriverInfo.workingHours}
                    onChange={(hours) => setNewDriverInfo({
                      ...newDriverInfo,
                      workingHours: hours
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl">
                    <input
                      type="checkbox"
                      id="available"
                      checked={newDriverInfo.available}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, available: e.target.checked })}
                      className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label htmlFor="available" className="text-sm font-medium text-gray-700">
                      Fahrer ist verfügbar
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl">
                    <input
                      type="checkbox"
                      id="manuallyOnline"
                      checked={newDriverInfo.manuallyOnline}
                      onChange={(e) => setNewDriverInfo({ ...newDriverInfo, manuallyOnline: e.target.checked })}
                      className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="manuallyOnline" className="text-sm font-medium text-gray-700">
                      Manuell online geschaltet
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 road-sign py-3 font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Fahrer hinzufügen
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayAddForm(false)}
                    className="flex-1 pro-card border-2 border-gray-300 py-3 font-semibold text-gray-700 rounded-xl hover:border-red-500 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const StarIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
)