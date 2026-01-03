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
    FunctionField,
    SaveButton,
    Toolbar,
    SelectInput,
    SelectArrayInput,
} from 'react-admin';
import {Box, Chip, Typography, CircularProgress} from '@mui/material';
import {useStyles} from '@/contexts/StyleContext';

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

const StylesDisplay = () => {
    const record = useRecordContext();
    if (!record?.styles || record.styles.length === 0) {
        return <span style={{color: '#999', fontStyle: 'italic'}}>No styles</span>;
    }

    return (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
            {record.styles.map((style: {id: number, name: string}) => (
                <Chip
                    key={style.id}
                    label={style.name}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{fontSize: '11px'}}
                />
            ))}
        </Box>
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
            <StylesDisplay label="Styles"/>
            <TagsDisplay label="Tags"/>
            <DateField source="created_at" label="Created"/>
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

const StylesInput = () => {
    const record = useRecordContext();
    const {styles: allStyles, loading: stylesLoading} = useStyles();

    // Convert styles to choices format for SelectArrayInput
    const styleChoices = allStyles.map(style => ({
        id: style.id,
        name: style.name,
    }));

    return (
        <Box sx={{mb: 2}}>
            <Typography variant="subtitle2" sx={{mb: 1}}>
                Current Styles
            </Typography>
            {record?.styles && record.styles.length > 0 ? (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2}}>
                    {record.styles.map((style: {id: number, name: string}) => (
                        <Chip key={style.id} label={style.name} size="small" color="primary" variant="outlined"/>
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" color="textSecondary" sx={{mb: 2}}>
                    No styles assigned
                </Typography>
            )}

            {stylesLoading ? (
                <CircularProgress size={20}/>
            ) : (
                <SelectArrayInput
                    source="style_ids"
                    label="Select Styles"
                    choices={styleChoices}
                    fullWidth
                    helperText="Select one or more styles for this tattoo"
                />
            )}
        </Box>
    );
};

const TattooEditToolbar = () => {
    return (
        <Toolbar>
            <SaveButton/>
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
                        <StylesInput/>
                    </Box>
                </Box>
            </SimpleForm>
        </Edit>
    );
};
