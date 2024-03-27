import {
  IonApp, setupIonicReact, AnimationBuilder
} from '@ionic/react';

import 'tailwindcss/tailwind.css';
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
// import '@ionic/react/css/normalize.css'; // commented as radio button styling gets messed up
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import "cal-sans";
/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// import './styles/global.css';
import './styles/variables.css';
import { FrappeProvider } from 'frappe-react-sdk';
import { UserProvider } from './utils/auth/UserProvider';
import { Routes } from './utils/auth/Routes';
import { ChannelListProvider } from './utils/channel/ChannelListProvider';
import { UserListProvider } from './utils/users/UserListProvider';
import { ActiveUsersProvider } from './utils/users/ActiveUsersProvider';
import { createAnimation, iosTransitionAnimation } from '@ionic/core';
import { isPlatform } from '@ionic/react';
import { useEffect } from 'react';
import { showNotification } from './utils/pushNotifications';

const animationBuilder: AnimationBuilder = (baseEl, opts) => {
  if (opts.direction === "back") {
    return createAnimation(); // TODO: not sure if it is correct way to create empty animation
  }

  return iosTransitionAnimation(baseEl, opts);
};
setupIonicReact({
  mode: 'ios',
  swipeBackEnabled: false,
  navAnimation: isPlatform('ios') ? animationBuilder : undefined,
})

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

  useEffect(() => {
    //@ts-expect-error
    window?.frappePushNotification?.onMessage((payload) => {
      showNotification(payload)
    })
  }, [])

  return (
    <IonApp>
      <FrappeProvider
        socketPort={import.meta.env.VITE_SOCKET_PORT ? import.meta.env.VITE_SOCKET_PORT : undefined}
        //@ts-ignore
        siteName={getSiteName()}>
        <UserProvider>
          <UserListProvider>
            <ChannelListProvider>
              <ActiveUsersProvider>
                <Routes />
              </ActiveUsersProvider>
            </ChannelListProvider>
          </UserListProvider>
        </UserProvider>
      </FrappeProvider>
    </IonApp>
  )
}

export default App