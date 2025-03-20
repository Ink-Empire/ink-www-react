export interface ArtistType {
    type: string;
    id?: number;
    about: string;
    email: string;
    name?: string;
    shop?: string;
    primaryImageId?: number;
    twitter?: string;
    location?: string;
    phone?: string;
    styles?: string[];
    image?: {
        uri: string;
        artistId?: number;
        title?: string;
    };
    tattoos?: any[];
}