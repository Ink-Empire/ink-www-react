export interface ArtistSettings {
    id?: number;
    artist_id?: number;
    books_open?: boolean | number;
    accepts_walk_ins?: boolean | number;
    accepts_deposits?: boolean | number;
    accepts_consultations?: boolean | number;
    accepts_appointments?: boolean | number;
    consultation_required?: boolean;
    deposit_required?: boolean;
    deposit_amount?: number;
    min_price?: number;
    hourly_rate?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export interface ArtistType {
    settings?: ArtistSettings;
    type: string;
    id?: number;
    slug?: string;
    about: string;
    email: string;
    name?: string;
    studio_name?: string;
    primaryImageId?: number;
    twitter?: string;
    location?: string;
    timezone?: string;
    phone?: string;
    styles?: (string | {id: number, name: string, parent_id?: number})[];
    primary_image?: {
        id: number;
        uri: string;
        artistId?: number;
        title?: string;
        filename?: string;
    };
    image?: {
        id: number;
        uri: string;
    };
    tattoos?: any[];
}