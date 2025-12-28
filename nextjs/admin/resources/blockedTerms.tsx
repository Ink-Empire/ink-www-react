import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  BooleanInput,
  SelectInput,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  SearchInput,
  useRecordContext,
} from 'react-admin';

const categoryChoices = [
  { id: 'explicit', name: 'Explicit' },
  { id: 'profanity', name: 'Profanity' },
  { id: 'hate', name: 'Hate Speech' },
  { id: 'violence', name: 'Violence' },
];

const blockedTermFilters = [
  <SearchInput source="q" alwaysOn key="search" />,
  <SelectInput source="category" choices={categoryChoices} key="category" />,
  <BooleanInput source="is_active" label="Active Only" key="active" />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
);

const CategoryChip = () => {
  const record = useRecordContext();
  if (!record || !record.category) return null;

  const colors: Record<string, string> = {
    explicit: '#e91e63',
    profanity: '#ff9800',
    hate: '#f44336',
    violence: '#9c27b0',
  };

  return (
    <span style={{
      backgroundColor: colors[record.category] || '#757575',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      textTransform: 'capitalize'
    }}>
      {record.category}
    </span>
  );
};

export const BlockedTermList = () => (
  <List
    filters={blockedTermFilters}
    actions={<ListActions />}
    sort={{ field: 'term', order: 'ASC' }}
    perPage={50}
  >
    <Datagrid>
      <TextField source="id" />
      <TextField source="term" />
      <CategoryChip label="Category" />
      <BooleanField source="is_active" label="Active" />
      <DateField source="created_at" label="Created" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const BlockedTermEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="term" />
      <SelectInput source="category" choices={categoryChoices} />
      <BooleanInput source="is_active" label="Active" />
    </SimpleForm>
  </Edit>
);

export const BlockedTermCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="term" required />
      <SelectInput source="category" choices={categoryChoices} />
      <BooleanInput source="is_active" label="Active" defaultValue={true} />
    </SimpleForm>
  </Create>
);
