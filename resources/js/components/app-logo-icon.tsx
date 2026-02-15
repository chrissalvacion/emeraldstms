import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/emerald-logo.svg"
            alt={props.alt ?? 'Emerald Logo'}
        />
    );
}
