import { FrappeProvider } from 'frappe-react-sdk'
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { MainPage } from './pages/MainPage'
import { ProtectedRoute } from './utils/auth/ProtectedRoute'
import { UserProvider } from './utils/auth/UserProvider'
import { ChannelRedirect } from './utils/channel/ChannelRedirect'
import "cal-sans";
import { ThemeProvider } from './ThemeProvider'
import { Toaster } from 'sonner'
import MobileTabsPage from './pages/MobileTabsPage'
import { UserProfile } from './components/feature/userSettings/UserProfile/UserProfile'
import { Appearance } from './components/feature/userSettings/Appearance/Appearance'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/login' lazy={() => import('@/pages/auth/Login')} />
      <Route path='/login-with-email' lazy={() => import('@/pages/auth/LoginWithEmail')} />
      <Route path='/signup' lazy={() => import('@/pages/auth/SignUp')} />
      <Route path='/forgot-password' lazy={() => import('@/pages/auth/ForgotPassword')} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route path="/" element={<ChannelRedirect />}>
          <Route path="channel" element={<MainPage />} >
            <Route index element={<MobileTabsPage />} />
            <Route path="saved-messages" lazy={() => import('./components/feature/saved-messages/SavedMessages')} />
            <Route path="settings" lazy={() => import('./pages/settings/Settings')}>
              <Route index element={<UserProfile />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="appearance" element={<Appearance />} />
              <Route path="users" lazy={() => import('./components/feature/userSettings/Users/AddUsers')} />
              <Route path="frappe-hr" lazy={() => import('./pages/settings/Integrations/FrappeHR')} />
              {/* <Route path="bots" lazy={() => import('./components/feature/userSettings/Bots')} /> */}
            </Route>
            <Route path=":channelID" lazy={() => import('@/pages/ChatSpace')} />
          </Route>
          {/* <Route path='settings' lazy={() => import('./pages/settings/Settings')}>
            <Route path='integrations'>
              <Route path='webhooks' lazy={() => import('./pages/settings/Webhooks/WebhookList')} />
              <Route path='webhooks/create' lazy={() => import('./pages/settings/Webhooks/CreateWebhook')} />
              <Route path='webhooks/:ID' lazy={() => import('./pages/settings/Webhooks/ViewWebhook')} />
              <Route path='scheduled-messages' lazy={() => import('./pages/settings/ServerScripts/SchedulerEvents/SchedulerEvents')} />
              <Route path='scheduled-messages/create' lazy={() => import('./pages/settings/ServerScripts/SchedulerEvents/CreateSchedulerEvent')} />
              <Route path='scheduled-messages/:ID' lazy={() => import('./pages/settings/ServerScripts/SchedulerEvents/ViewSchedulerEvent')} />
            </Route>
          </Route> */}
        </Route>
      </Route>
    </>
  ), {
  basename: `/${import.meta.env.VITE_BASE_NAME}` ?? '',
}
)
function App() {

  // We need to pass sitename only if the Frappe version is v15 or above.
  const getSiteName = () => {
    // @ts-ignore
    if (window.frappe?.boot?.versions?.frappe && (window.frappe.boot.versions.frappe.startsWith('15') || window.frappe.boot.versions.frappe.startsWith('16'))) {
      // @ts-ignore
      return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME
    }
    return import.meta.env.VITE_SITE_NAME

  }

  return (
    <FrappeProvider
      url={import.meta.env.VITE_FRAPPE_PATH ?? ''}
      socketPort={import.meta.env.VITE_SOCKET_PORT ? import.meta.env.VITE_SOCKET_PORT : undefined}
      //@ts-ignore
      swrConfig={{
        provider: localStorageProvider
      }}
      siteName={getSiteName()}
    >
      <UserProvider>
        <Toaster richColors />
          <ThemeProvider
            // grayColor='slate'
            accentColor='iris'
            panelBackground='translucent'>
            <RouterProvider router={router} />
          </ThemeProvider>
      </UserProvider>
    </FrappeProvider>
  )
}

function localStorageProvider() {
  // When initializing, we restore the data from `localStorage` into a map.
  const map = new Map<string, any>(JSON.parse(localStorage.getItem('app-cache') || '[]'))

  // Before unloading the app, we write back all the data into `localStorage`.
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()))
    localStorage.setItem('app-cache', appCache)
  })

  // We still use the map for write & read for performance.
  return map
}

export default App