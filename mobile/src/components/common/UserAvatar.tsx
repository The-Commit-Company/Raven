import { IonSkeletonText } from '@ionic/react'
import avatar from '@/assets/male-avatar.svg'
import { useInView } from 'react-intersection-observer'

interface AvatarProps {
    src?: string,
    alt: string,
    slot?: string,
    isActive?: boolean,
    size?: string,
}
const options = {
    root: null,
    rootMargin: "50px",
    threshold: 0.5,
    triggerOnce: true
}
export const UserAvatar = ({ src, alt, slot, size = '8', isActive }: AvatarProps) => {
    const { ref, inView } = useInView(options)
    return <span ref={ref} slot={slot} className="relative inline-block">
        {inView ? <img
            className={`h-${size} w-${size} rounded-md bg-zinc-900 object-cover`}
            src={src ? src : avatar}
            alt={alt}
            loading='lazy'
        /> : <IonSkeletonText animated className={`h-${size} w-${size} rounded-md`} />}
        {isActive &&
            <span className="absolute bottom-0 right-0 block translate-x-1/2 translate-y-1/2 transform rounded-full">
                <span className="block h-2 w-2 rounded-full bg-green-500" />
            </span>
        }
    </span>
}
export const SquareAvatar = ({ src, alt, size = '8', isActive }: AvatarProps) => {
    const { ref, inView } = useInView(options)
    return <span ref={ref} className="relative inline-block">
        {inView ? <img
            className={`h-${size} w-${size} rounded-md bg-zinc-900 object-cover`}
            src={src ? src : avatar}
            alt={alt}
            loading='lazy'
        /> : <IonSkeletonText animated className={`h-${size} w-${size} rounded-md`} />}
        {isActive &&
            <span className="absolute bottom-0 right-0 block translate-x-1/2 translate-y-1/2 transform rounded-full">
                <span className="block h-2 w-2 rounded-full bg-green-500" />
            </span>
        }
    </span>
}