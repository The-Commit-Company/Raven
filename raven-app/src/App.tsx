import { FrappeProvider } from 'frappe-react-sdk'
import { Outlet, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { MainPage } from './pages/MainPage'
import { ProtectedRoute } from './utils/auth/ProtectedRoute'
import { UserProvider } from './utils/auth/UserProvider'
import { ChannelRedirect } from './utils/channel/ChannelRedirect'
import "cal-sans";
import { ThemeProvider } from './ThemeProvider'
import { Toaster } from './components/common/Toast/Toaster'
import { FullPageLoader } from './components/layout/Loaders'
import { useStickyState } from './hooks/useStickyState'
import { Settings } from './pages/settings/Settings'
import { DocTypeEvents } from './pages/settings/ServerScripts/DocTypeEvents'
import { CreateDocTypeEvent } from './pages/settings/ServerScripts/CreateDocTypeEvent'
import { ViewDocTypeEvent } from './pages/settings/ServerScripts/ViewDocTypeEvent'
import { APIEvents } from './pages/settings/ServerScripts/APIEvents/APIEvents'
import { CreateAPIEvent } from './pages/settings/ServerScripts/APIEvents/CreateAPIEvents'
import { ViewAPIEvent } from './pages/settings/ServerScripts/APIEvents/ViewAPIEvents'
import { TemporalEvents } from './pages/settings/ServerScripts/TemporalEvents/TemporalEvents'
import { ViewTemporalEvent } from './pages/settings/ServerScripts/TemporalEvents/ViewTemporalEvent'
import { CreateTemporalEvent } from './pages/settings/ServerScripts/TemporalEvents/CreateTemporalEvent'


const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/login' lazy={() => import('@/pages/auth/Login')} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<ChannelRedirect />} />
        <Route path="channel" element={<MainPage />} >
          <Route index element={<ChannelRedirect />} />
          <Route path="saved-messages" lazy={() => import('./components/feature/saved-messages/SavedMessages')} />
          <Route path=":channelID" lazy={() => import('@/pages/ChatSpace')} />
        </Route>
        <Route path='settings' element={<Settings />}>
          <Route path='integrations'>
            <Route path='doctype-events' element={<Outlet />}>
              <Route index element={<DocTypeEvents />} />
              <Route path='create' element={<CreateDocTypeEvent />} />
              <Route path=':eventID' element={<ViewDocTypeEvent />} />
            </Route>
            <Route path='scheduled-scripts' element={<Outlet />}>
              <Route index element={<TemporalEvents />} />
              <Route path='create' element={<CreateTemporalEvent />} />
              <Route path=':scriptID' element={<ViewTemporalEvent />} />
            </Route>
            <Route path='api-events' element={<Outlet />}>
              <Route index element={<APIEvents />} />
              <Route path='create' element={<CreateAPIEvent />} />
              <Route path=':apiID' element={<ViewAPIEvent />} />
            </Route>
          </Route>
        </Route>
      </Route >
    </>
  ), {
  basename: `/${import.meta.env.VITE_BASE_NAME}` ?? '',
}
)
function App() {

  const [appearance, setAppearance] = useStickyState<'light' | 'dark'>('dark', 'appearance');

  const toggleTheme = () => {
    setAppearance(appearance === 'dark' ? 'light' : 'dark');
  };

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
      siteName={getSiteName()}
    >
      <UserProvider>
        <ThemeProvider
          appearance={appearance}
          // grayColor='slate'
          accentColor='iris'
          panelBackground='translucent'
          toggleTheme={toggleTheme}>
          <RouterProvider router={router} fallbackElement={<FullPageLoader className='w-screen' />} />
          <Toaster />
        </ThemeProvider>
      </UserProvider>
    </FrappeProvider>
  )
}

export default App