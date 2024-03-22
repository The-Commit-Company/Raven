import { lazy, Suspense } from "react";
const MomentConverter = lazy(() => import("./MomentConverter"));
import { USER_TIMEZONE } from "./utils";

interface Props {
    date: string;
}
/**
 * Returns a date in the standard format that the user has set in their preferences
 * @param props 
 * @returns 
 */
export const StandardDate = (props: Props) => {

    const parseDateString = (date: string) => {
        const dateObj = new Date(date)
        return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
    }
    return (
        <Suspense fallback={parseDateString(props.date)}>
            <MomentConverter {...props} />
        </Suspense>
    )
}

/**
 * Returns a date in DD MMM YYYY format
 */
export const DateMonthYear = (props: Props) => {

    const parseDateString = (date: string) => {
        const dateObj = new Date(date)
        return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    const date = new Date();
    const currentDate = new Date().toLocaleString('en-US', { timeZone: USER_TIMEZONE });
    return (
        <Suspense fallback={parseDateString(props.date)}>
            {parseDateString(currentDate) === parseDateString(props.date) ?
                "Today" :
                <MomentConverter {...props} format="Do MMMM YYYY" />}
        </Suspense>
    )
}

interface HourMinuteAmPmProps extends Props {
    amPm?: boolean
}
/**
 * 
 * @returns JSX Element of the format hh:mm AM/PM
 * @example 08:15 PM or 12:00 AM
 */
export const HourMinuteAmPm = ({ amPm = true, date }: HourMinuteAmPmProps) => {

    const parseDateString = (d: string) => {
        const dateObj = new Date(d)
        return dateObj.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: amPm })
    }
    return (
        <Suspense fallback={parseDateString(date)}>
            <MomentConverter date={date} format={amPm ? "hh:mm A" : "hh:mm"} />
        </Suspense>
    )
}

export const DateMonthAtHourMinuteAmPm = (props: Props) => {

    const parseDateString = (date: string) => {
        const dateObj = new Date(date)
        return dateObj.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' }) + " at " + dateObj.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true })
    }
    return (
        <Suspense fallback={parseDateString(props.date)}>
            <MomentConverter {...props} format="Do MMMM \at hh:mm A" />
        </Suspense>
    )
}