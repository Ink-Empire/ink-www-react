import {useState} from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    Edit,
    SimpleForm,
    TextInput,
    EditButton,
    FilterButton,
    TopToolbar,
    SearchInput,
    useRecordContext,
    useRefresh,
    useNotify,
    Button,
    FunctionField,
    ImageField,
    useUpdate,
    SaveButton,
    Toolbar, SelectInput,
} from 'react-admin';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import {Box, Chip, Typography, CircularProgress} from '@mui/material';
import {api} from '@/utils/api';

const tattooFilters = [
    <SearchInput source="q" alwaysOn key="search" placeholder="Search descriptions..."/>,
];

const ListActions = () => (
    <TopToolbar>
        <FilterButton/>
    </TopToolbar>
);

const TattooImage = () => {
    const record = useRecordContext();
    if (!record?.primary_image) return <span style={{color: '#999'}}>No image</span>;

    return (
        <img
            src={record.primary_image}
            alt="Tattoo"
            style={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 4,
            }}
        />
    );
};

const TagsDisplay = () => {
    const record = useRecordContext();
    if (!record?.tags || record.tags.length === 0) {
        return <span style={{color: '#999', fontStyle: 'italic'}}>No tags</span>;
    }

    return (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
            {record.tags.map((tag: string, index: number) => (
                <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{fontSize: '11px'}}
                />
            ))}
        </Box>
    );
};

const AIFixButton = () => {
    const record = useRecordContext();
    const refresh = useRefresh();
    const notify = useNotify();
    const [loading, setLoading] = useState(false);

    if (!record) return null;

    const handleFix = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!confirm('Analyze this tattoo with AI and fix description/tags?')) {
            return;
        }

        setLoading(true);
        try {
            const result = await api.post(`/admin/tattoos/${record.id}/fix-ai`, {
                create_tags: true,
            });
            notify(`Fixed! New tags: ${result.final_tags?.join(', ') || 'none'}`, {type: 'success'});
            refresh();
        } catch (error: any) {
            notify(error?.message || 'Failed to fix tattoo', {type: 'error'});
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            label={loading ? 'Fixing...' : 'AI Fix'}
            onClick={handleFix}
            disabled={loading}
            color="primary"
        >
            {loading ? <CircularProgress size={16}/> : <AutoFixHighIcon/>}
        </Button>
    );
};

export const TattooList = () => (
    <List
        filters={tattooFilters}
        actions={<ListActions/>}
        sort={{field: 'id', order: 'DESC'}}
        perPage={25}
    >
        <Datagrid rowClick="edit">
            <TextField source="id"/>
            <TattooImage label="Image"/>
            <FunctionField
                label="Description"
                render={(record: any) => (
                    <span style={{
                        maxWidth: 300,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
            {record.description || <em style={{color: '#999'}}>No description</em>}
          </span>
                )}
            />
            <TextField source="artist_name" label="Artist"/>
            <TagsDisplay label="Tags"/>
            <DateField source="created_at" label="Created"/>
            <AIFixButton/>
            <EditButton/>
        </Datagrid>
    </List>
);

const TagsInput = () => {
    const record = useRecordContext();
    const [tagInput, setTagInput] = useState('');
    const [initialized, setInitialized] = useState(false);

    // Initialize with current tags
    if (record && !initialized) {
        setTagInput(record.tags?.join(', ') || '');
        setInitialized(true);
    }

    return (
        <Box sx={{mb: 2}}>
            <Typography variant="subtitle2" sx={{mb: 1}}>
                Current Tags
            </Typography>
            {record?.tags && record.tags.length > 0 ? (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2}}>
                    {record.tags.map((tag: string, index: number) => (
                        <Chip key={index} label={tag} size="small"/>
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" color="textSecondary" sx={{mb: 2}}>
                    No tags assigned
                </Typography>
            )}

            <TextInput
                source="tag_names"
                label="Enter Tags (comma-separated)"
                fullWidth
                helperText="Enter tag names separated by commas. New tags will be created automatically."
                defaultValue={record?.tags?.join(', ') || ''}
            />
        </Box>
    );
};

const TattooEditToolbar = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const [loading, setLoading] = useState(false);

    const handleAIFix = async () => {
        if (!record) return;

        if (!confirm('Analyze this tattoo with AI and update description/tags?')) {
            return;
        }

        setLoading(true);
        try {
            await api.post(`/admin/tattoos/${record.id}/fix-ai`, {
                create_tags: true,
            });
            notify('AI analysis complete! Refreshing...', {type: 'success'});
            refresh();
        } catch (error: any) {
            notify(error?.message || 'Failed to run AI fix', {type: 'error'});
        } finally {
            setLoading(false);
        }
    };

    return (
        <Toolbar sx={{display: 'flex', justifyContent: 'space-between'}}>
            <SaveButton/>
            <Button
                label={loading ? 'Running AI...' : 'Run AI Fix'}
                onClick={handleAIFix}
                disabled={loading}
                color="secondary"
                variant="outlined"
            >
                {loading ? <CircularProgress size={16}/> : <AutoFixHighIcon/>}
            </Button>
        </Toolbar>
    );
};

export const TattooEdit = () => {
    return (
        <Edit mutationMode="pessimistic">
            <SimpleForm toolbar={<TattooEditToolbar/>}>
                <Box sx={{display: 'flex', gap: 3, width: '100%'}}>
                    <Box sx={{flex: '0 0 200px'}}>
                        <FunctionField
                            render={(rec: any) =>
                                rec?.primary_image ? (
                                    <img
                                        src={rec.primary_image}
                                        alt="Tattoo"
                                        style={{
                                            width: '100%',
                                            maxWidth: 200,
                                            borderRadius: 8,
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            width: 200,
                                            height: 200,
                                            backgroundColor: '#f0f0f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 2,
                                        }}
                                    >
                                        No image
                                    </Box>
                                )
                            }
                        />
                    </Box>

                    <Box sx={{flex: 1}}>
                        <TextInput source="id" disabled/>
                        <FunctionField
                            render={(rec: any) => (
                                <Typography variant="body2" color="textSecondary" sx={{mb: 2}}>
                                    Artist: {rec?.artist_name || 'Unknown'}
                                </Typography>
                            )}
                        />
                        <TextInput
                            source="description"
                            label="Description"
                            multiline
                            rows={3}
                            fullWidth
                        />
                        <SelectInput
                            source="placement"
                            label="Placement"
                            choices={
                                [
                                    {id: 'Forearm', name: 'Forearm'},
                                    {id: 'Upper Arm', name: 'Upper Arm'},
                                    {id: 'Full Sleeve', name: 'Full Sleeve'},
                                    {id: 'Chest', name: 'Chest'},
                                    {id: 'Collarbone', name: 'Collarbone'},
                                    {id: 'Full Back', name: 'Full Back'},
                                    {id: 'Lower Back', name: 'Lower Back'},
                                    {id: 'Buttocks', name: 'Buttocks'},
                                    {id: 'Shoulder', name: 'Shoulder'},
                                    {id: 'Throat', name: 'Throat'},
                                    {id: 'Thigh', name: 'Thigh'},
                                    {id: 'Calf', name: 'Calf'},
                                    {id: 'Leg Sleeve', name: 'Leg Sleeve'},
                                    {id: 'Ribs', name: 'Ribs'},
                                    {id: 'Abdomen', name: 'Abdomen'},
                                    {id: 'Wrist', name: 'Wrist'},
                                    {id: 'Upper arm', name: 'Upper arm'},
                                    {id: 'Knee', name: 'Knee'},
                                    {id: 'Elbow', name: 'Elbow'},
                                    {id: 'Ankle', name: 'Ankle'},
                                    {id: 'Foot', name: 'Foot'},
                                    {id: 'Behind the Ear', name: 'Behind the Ear'},
                                    {id: 'Neck', name: 'Neck'},
                                    {id: 'Head', name: 'Head'},
                                    {id: 'Face', name: 'Face'},
                                ]
                            }
                        />
                        <TagsInput/>
                    </Box>
                </Box>
            </SimpleForm>
        </Edit>
    );
};
