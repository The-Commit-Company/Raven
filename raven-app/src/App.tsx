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
import { CreateWebhook } from './components/feature/integrations/webhooks/CreateWebhook'
import ViewWebhook from './components/feature/integrations/webhooks/ViewWebhook'
import { WebhookList } from './components/feature/integrations/webhooks/WebhookList'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/login' lazy={() => import('@/pages/auth/Login')} />
      <Route path='/login-with-email' lazy={() => import('@/pages/auth/LoginWithEmail')} />
      <Route path='/signup' lazy={() => import('@/pages/auth/SignUp')} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route path="/" element={<ChannelRedirect />}>
          <Route path="channel" element={<MainPage />} >
            <Route index element={<ChannelRedirect />} />
            <Route path="saved-messages" lazy={() => import('./components/feature/saved-messages/SavedMessages')} />
            <Route path=":channelID" lazy={() => import('@/pages/ChatSpace')} />
          </Route>
          <Route path='settings' element={<Settings />}>
            <Route path='integrations'>
              <Route path='webhooks' element={<WebhookList />} />
              <Route path='webhooks/create' element={<CreateWebhook />} />
              <Route path='webhooks/:ID' element={<ViewWebhook />} />
            </Route>
          </Route>
        </Route>
      </Route>
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