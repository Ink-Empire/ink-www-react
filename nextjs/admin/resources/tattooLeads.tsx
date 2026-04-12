import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    NumberField,
    DateField,
    FunctionField,
    FilterButton,
    TopToolbar,
    SearchInput,
    SelectInput,
    BooleanField,
    Show,
    SimpleShowLayout,
    useRecordContext,
    useRefresh,
    useNotify,
    useUpdate,
    Button,
} from 'react-admin';
import { Box, Chip, Typography } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

const tattooLeadFilters = [
    <SearchInput source="q" alwaysOn key="search" placeholder="Search description or user..." />,
    <SelectInput
        source="is_active"
        label="Status"
        key="is_active"
        choices={[
            { id: 'true', name: 'Active' },
            { id: 'false', name: 'Inactive' },
        ]}
        alwaysOn
    />,
    <SelectInput
        source="allow_artist_contact"
        label="Allows Contact"
        key="allow_artist_contact"
        choices={[
            { id: 'true', name: 'Yes' },
            { id: 'false', name: 'No' },
        ]}
    />,
    <SelectInput
        source="has_tattoo"
        label="Post Type"
        key="has_tattoo"
        choices={[
            { id: 'true', name: 'Seeking post (with images)' },
            { id: 'false', name: 'Text-only beacon' },
        ]}
    />,
];

const ListActions = () => (
    <TopToolbar>
        <FilterButton />
    </TopToolbar>
);

const LeadThumbnail = () => {
    const record = useRecordContext();
    if (!record?.tattoo?.primary_image) {
        return <span style={{ color: '#999', fontSize: 11 }}>Text only</span>;
    }
    return (
        <img
            src={record.tattoo.primary_image}
            alt="Seeking post"
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
        />
    );
};

const ClientCell = () => {
    const record = useRecordContext();
    if (!record?.user) return <span style={{ color: '#999' }}>—</span>;
    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {record.user.name || record.user.username}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
                {record.user.email}
            </Typography>
        </Box>
    );
};

const DescriptionCell = () => {
    const record = useRecordContext();
    const text = record?.description;
    if (!text) return <em style={{ color: '#999' }}>No description</em>;
    return (
        <span
            style={{
                maxWidth: 280,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}
        >
            {text}
        </span>
    );
};

const TimingChip = () => {
    const record = useRecordContext();
    if (!record?.timing_label) return null;
    return <Chip label={record.timing_label} size="small" variant="outlined" />;
};

const LocationCell = () => {
    const record = useRecordContext();
    const loc = record?.location || record?.user?.location;
    if (!loc) return <span style={{ color: '#999' }}>—</span>;
    const radius = record?.radius ? `${record.radius}${record.radius_unit || 'mi'}` : null;
    return (
        <Box>
            <Typography variant="body2">{loc}</Typography>
            {radius && (
                <Typography variant="caption" sx={{ color: '#666' }}>
                    {radius} radius
                </Typography>
            )}
        </Box>
    );
};

const StatusChip = () => {
    const record = useRecordContext();
    if (!record) return null;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Chip
                label={record.is_active ? 'Active' : 'Inactive'}
                size="small"
                sx={{
                    backgroundColor: record.is_active ? '#4caf50' : '#9e9e9e',
                    color: 'white',
                    fontSize: 11,
                }}
            />
            {!record.allow_artist_contact && (
                <Chip
                    label="No contact"
                    size="small"
                    sx={{ backgroundColor: '#ff9800', color: 'white', fontSize: 11 }}
                />
            )}
        </Box>
    );
};

const DeactivateButton = () => {
    const record = useRecordContext();
    const refresh = useRefresh();
    const notify = useNotify();
    const [update, { isLoading }] = useUpdate();

    if (!record?.is_active) return null;

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Deactivate beacon for ${record.user?.name || record.user?.username || 'this user'}?`)) return;
        try {
            await update(
                'tattoo-leads',
                { id: record.id, data: { is_active: false }, previousData: record },
                { returnPromise: true }
            );
            notify('Beacon deactivated', { type: 'success' });
            refresh();
        } catch {
            notify('Failed to deactivate beacon', { type: 'error' });
        }
    };

    return (
        <Button label="Deactivate" onClick={handleClick} disabled={isLoading} color="warning">
            <PowerSettingsNewIcon />
        </Button>
    );
};

export const TattooLeadList = () => (
    <List
        filters={tattooLeadFilters}
        filterDefaultValues={{ is_active: 'true' }}
        actions={<ListActions />}
        sort={{ field: 'created_at', order: 'DESC' }}
        perPage={25}
    >
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="id" />
            <LeadThumbnail label="Post" />
            <ClientCell label="Client" />
            <DescriptionCell label="Description" />
            <TimingChip label="Timing" />
            <LocationCell label="Location" />
            <StatusChip label="Status" />
            <NumberField source="artists_notified" label="Notified" />
            <DateField source="created_at" label="Created" showTime />
            <DeactivateButton />
        </Datagrid>
    </List>
);

const NotifiedArtistsList = () => {
    const record = useRecordContext();
    const artists: Array<{ id: number; name: string; username: string; email: string; location?: string }> =
        record?.notified_artists || [];

    if (!artists.length) {
        return (
            <Typography variant="body2" color="textSecondary">
                No artists have been notified for this beacon yet.
            </Typography>
        );
    }

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Notified Artists ({artists.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {artists.map((a) => (
                    <Box
                        key={a.id}
                        sx={{
                            p: 1,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {a.name || a.username}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                {a.email}
                            </Typography>
                        </Box>
                        {a.location && (
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                {a.location}
                            </Typography>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export const TattooLeadShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <FunctionField
                label="Client"
                render={(rec: any) =>
                    rec?.user ? `${rec.user.name || rec.user.username} (${rec.user.email})` : '—'
                }
            />
            <TextField source="description" />
            <TextField source="timing_label" label="Timing" />
            <DateField source="interested_by" label="Interested By" />
            <BooleanField source="is_active" label="Active" />
            <BooleanField source="allow_artist_contact" label="Allows Artist Contact" />
            <TextField source="location" label="Location" />
            <FunctionField
                label="Coordinates"
                render={(rec: any) => (rec?.lat && rec?.lng ? `${rec.lat}, ${rec.lng}` : '—')}
            />
            <FunctionField
                label="Radius"
                render={(rec: any) => (rec?.radius ? `${rec.radius}${rec.radius_unit || 'mi'}` : '—')}
            />
            <NumberField source="artists_notified" label="Artists Notified" />
            <FunctionField
                label="Linked Post"
                render={(rec: any) =>
                    rec?.tattoo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {rec.tattoo.primary_image && (
                                <img
                                    src={rec.tattoo.primary_image}
                                    alt="Seeking post"
                                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                />
                            )}
                            <Typography variant="body2">
                                Tattoo #{rec.tattoo.id} ({rec.tattoo.post_type})
                            </Typography>
                        </Box>
                    ) : (
                        <em>Text-only beacon (no linked post)</em>
                    )
                }
            />
            <DateField source="created_at" label="Created" showTime />
            <NotifiedArtistsList />
        </SimpleShowLayout>
    </Show>
);
