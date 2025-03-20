export interface TattooType {
    type: string;
    id: number;
    about: string;
    description: string;
    artist: object;
    studio?: object;
    primary_style: string;
    primary_subject?: string;
    primary_image?: object;
    images?: object[];
    styles: object[];
    tags: object[];
    user_id: number;
}