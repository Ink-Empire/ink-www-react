export interface TattooImage {
    id?: number;
    uri?: string;
    url?: string;
}

export interface TattooArtist {
    id: number;
    name?: string;
    slug?: string;
    location?: string;
    primary_image?: TattooImage;
    image?: TattooImage;
}

export interface TattooStudio {
    id?: number;
    name?: string;
    slug?: string;
    location?: string;
}

export interface TattooStyle {
    id: number;
    name: string;
    slug?: string;
}

export interface TattooTag {
    id: number;
    name: string;
    slug?: string;
}

export interface TattooType {
    type?: string;
    id: number;
    title?: string;
    about?: string;
    description?: string;
    artist?: TattooArtist;
    studio?: TattooStudio;
    primary_style?: string;
    primary_subject?: string;
    primary_image?: TattooImage;
    image?: TattooImage;
    images?: TattooImage[];
    styles?: TattooStyle[];
    tags?: TattooTag[];
    user_id?: number;
    likes_count?: number;
    comments_count?: number;
    placement?: string;
    size?: string;
    sessions?: number;
    created_at?: string;
}