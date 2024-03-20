import React, { useState } from 'react'
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonModal, IonProgressBar, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { addSharp, alertCircle, checkmarkCircle, closeCircleOutline } from 'ionicons/icons';
import { getFileExtension } from '../../../../../raven-app/src/utils/operations';
import { getFileExtensionIcon } from '../../../utils/layout/fileExtensions';
import { useFrappeFileUpload } from 'frappe-react-sdk';
import { useGetUser } from '@/hooks/useGetUser';
import { useGetChannelData } from '@/hooks/useGetChannelData';
import { DMChannelListItem } from '@/utils/channel/ChannelListProvider';

type Props = {
    files: File[],
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    pickFiles: () => void,
    channelID: string,
    onMessageSend: () => void
}
export const fileExt = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'gif', 'GIF']
export const FileUploadModal = ({ files, setFiles, pickFiles, channelID, onMessageSend }: Props) => {

    const [currentFileName, setCurrentFileName] = useState('')
    const [completedFiles, setCompletedFiles] = useState<string[]>([])
    const { upload } = useFrappeFileUpload()

    const [loading, setLoading] = useState(false)
    const [errorMap, setErrorMap] = React.useState<{ [key: string]: string }>({})
    const { channel } = useGetChannelData(channelID)
    
    const generateDescriptionMessage = (channel: DMChannelListItem) =>{
        let text = "Files will be shared with "
        if(channel.is_direct_message===1 && channel.is_self_message===0){
            const user = useGetUser(channel.peer_user_id)
            return text + user?.full_name || user?.first_name
        }else if(channel.is_direct_message===1 && channel.is_self_message===1){
            // ** should the line be changed?
            return "Files will be stored here for your reference"
        } else{
            return text + "all channel members"
        }
    }
    

    const uploadFiles = async () => {
        setLoading(true)
        // Loop over all files and upload them
        for (let i = 0; i < files.length; i++) {
            setCurrentFileName(files[i].name)
            const file = files[i]
            await upload(file, {
                isPrivate: true,
                doctype: 'Raven Message',
                otherData: {
                    channelID: channelID,
                },
                fieldname: 'file',
            }, 'raven.api.upload_file.upload_file_with_message')
                .then((f) => {

                    setCompletedFiles(cf => [...cf, file.name])
                }).catch((e) => {
                    setErrorMap(em => ({ ...em, [file.name]: e.message }))
                })
        }
        onMessageSend()
        clearFiles()
    }
    const clearFiles = () => {
        setCurrentFileName('')
        setCompletedFiles([])
        setLoading(false)
        setErrorMap({})
        setFiles([])
    }

    const removeFile = (file: File) => {
        setFiles(f => f.filter((f) => f.name !== file.name))
    }

    const overallProgress = completedFiles.length / files.length

    return (
        <IonModal isOpen={files.length > 0}>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonButton color='medium' onClick={clearFiles} disabled={loading}>
                            Close
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Upload files</IonTitle>
                    <IonButtons slot='end'>
                        <IonButton className='font-bold' disabled={loading} onClick={uploadFiles}>
                            Upload
                        </IonButton>
                    </IonButtons>
                    <IonProgressBar type="determinate" hidden={!loading} value={overallProgress}></IonProgressBar>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <div className='py-2 mt-2 px-4 text-sm'>
                    <IonText color='medium'>{generateDescriptionMessage(channel as DMChannelListItem)}.</IonText>
                </div>
                <IonList>
                    {files.map((f, i) => <IonItem key={f.name + i}>
                        <div slot='start'>
                            {getFileExtensionIcon(getFileExtension(f.name))}
                        </div>
                        <IonLabel>{f.name}</IonLabel>
                        {!loading &&
                            <IonButton size='small' slot='end' color='danger' fill='clear' onClick={() => removeFile(f)}>
                                <IonIcon size='small' slot='icon-only' icon={closeCircleOutline} />
                            </IonButton>
                        }
                        {currentFileName === f.name && <IonSpinner slot='end' name="crescent"></IonSpinner>}
                        {completedFiles.includes(f.name) && <IonIcon size='small' slot='end' color='success' icon={checkmarkCircle} />}
                        {errorMap[f.name] && <IonIcon size='small' slot='end' color='danger' icon={alertCircle} />}
                    </IonItem>)}
                    {!loading && <IonItem lines='full' detail={false} button onClick={pickFiles}>
                        <IonIcon slot='start' color='primary' icon={addSharp} />
                        <IonLabel color='primary'>Add more</IonLabel>
                    </IonItem>
                    }
                </IonList>
            </IonContent>
        </IonModal>
    )
}