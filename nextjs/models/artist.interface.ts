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
    styles?: (string | {id: number, name: string, parent_id?: number})[];
    primary_image?: {
        id: number;
        uri: string;
        artistId?: number;
        title?: string;
        filename?: string;
    };
    tattoos?: any[];
}