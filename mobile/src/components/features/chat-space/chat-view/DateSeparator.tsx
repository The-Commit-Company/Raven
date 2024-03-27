
type Props = {
    date: string
}

export const DateSeparator = ({ date }: Props) => {
    return (
        <div className='relative flex items-center my-2 px-2' id={`date-${date}`}>
            <div className="grow border-t border-foreground/20"></div>
            <span className="shrink px-2 text-xs font-semibold text-foreground/80">{date}</span>
            <div className="grow border-t border-foreground/20"></div>
        </div>
    )
}