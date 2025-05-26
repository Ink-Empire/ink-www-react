export interface ArtistType {
    settings: ArtistSettings | undefined;
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