import { useGetChannelData } from "@/hooks/useGetChannelData"
import { ChannelListContext, ChannelListContextType } from "@/utils/channel/ChannelListProvider"
import { IonAlert, ToastOptions, useIonToast } from "@ionic/react"
import { useFrappeDeleteDoc } from "frappe-react-sdk"
import { useContext } from "react"
import { useHistory } from "react-router-dom"

interface DeleteChannelModalProps {
    isOpen: boolean,
    onDismiss: VoidFunction,
    channelID: string
}

export const DeleteChannelAlert = ({ isOpen, onDismiss, channelID }: DeleteChannelModalProps) => {

    const { channel } = useGetChannelData(channelID)

    const { mutate } = useContext(ChannelListContext) as ChannelListContextType

    const { deleteDoc, error } = useFrappeDeleteDoc()

    const history = useHistory()

    const [present] = useIonToast()

    const presentToast = (message: string, color: ToastOptions['color']) => {
        present({
            message,
            duration: 1500,
            color,
            position: 'bottom',
        })
    }

    const archiveChannel = () => {
        deleteDoc('Raven Channel', channel?.name)
            .then(() => {
                presentToast("Channel deleted successfully.", 'success')
                onDismiss()
                mutate()
                history.replace('/channels')
            }).catch((e) => {
                presentToast("Error while deleting the channel.", 'danger')
            })
    }

    return (
        <IonAlert onDidDismiss={onDismiss} isOpen={isOpen}
            header="Delete Channel"
            message={`Are you sure you want to delete #${channel?.channel_name}? This action cannot be undone.`}
            buttons={[
                {
                    text: 'No',
                    role: 'cancel',
                }
                , {
                    text: 'Yes',
                    role: 'destructive',
                    cssClass: 'text-danger',
                    handler: archiveChannel
                }
            ]} />
    )
}