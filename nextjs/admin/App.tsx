import { Admin, Resource, CustomRoutes, Layout, Menu } from 'react-admin';
import { Route } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StorageIcon from '@mui/icons-material/Storage';
import PlaceIcon from '@mui/icons-material/Place';
import BlockIcon from '@mui/icons-material/Block';
import BrushIcon from '@mui/icons-material/Brush';
import EmailIcon from '@mui/icons-material/Email';

import authProvider from './authProvider';
import dataProvider from './dataProvider';

import { UserList, UserEdit, UserCreate } from './resources/users';
import { StudioList, StudioEdit, StudioCreate } from './resources/studios';
import { TagList, TagEdit, TagCreate } from './resources/tags';
import { PlacementList, PlacementEdit, PlacementCreate } from './resources/placements';
import { BlockedTermList, BlockedTermEdit, BlockedTermCreate } from './resources/blockedTerms';
import { TattooList, TattooEdit } from './resources/tattoos';
import ElasticPanel from './pages/ElasticPanel';
import EmailTestPanel from './pages/EmailTestPanel';

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItem name="users" />
    <Menu.ResourceItem name="studios" />
    <Menu.ResourceItem name="tattoos" />
    <Menu.ResourceItem name="tags" />
    <Menu.ResourceItem name="placements" />
    <Menu.ResourceItem name="blocked-terms" />
    <Menu.Item to="/elastic" primaryText="Elasticsearch" leftIcon={<StorageIcon />} />
    <Menu.Item to="/email-test" primaryText="Email Testing" leftIcon={<EmailIcon />} />
  </Menu>
);

const CustomLayout = (props: any) => <Layout {...props} menu={CustomMenu} />;

const Dashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>InkedIn Admin</h1>
    <p>Welcome to the InkedIn admin panel.</p>
    <div style={{ marginTop: '20px' }}>
      <h3>Quick Actions</h3>
      <ul>
        <li><a href="#/users">Manage Users</a></li>
        <li><a href="#/studios">Manage Studios</a></li>
        <li><a href="#/tattoos">Manage Tattoos & Tags</a></li>
        <li><a href="#/tags?filter=%7B%22is_pending%22%3Atrue%7D">Review Pending Tags</a></li>
        <li><a href="#/elastic">Elasticsearch Management</a></li>
        <li><a href="#/email-test">Email Testing</a></li>
      </ul>
    </div>
  </div>
);

const AdminApp = () => (
  <Admin
    authProvider={authProvider}
    dataProvider={dataProvider}
    dashboard={Dashboard}
    layout={CustomLayout}
    title="InkedIn Admin"
  >
    <CustomRoutes>
      <Route path="/elastic" element={<ElasticPanel />} />
      <Route path="/email-test" element={<EmailTestPanel />} />
    </CustomRoutes>
    <Resource
      name="users"
      list={UserList}
      edit={UserEdit}
      create={UserCreate}
      icon={PeopleIcon}
    />
    <Resource
      name="studios"
      list={StudioList}
      edit={StudioEdit}
      create={StudioCreate}
      icon={StoreIcon}
    />
    <Resource
      name="tattoos"
      list={TattooList}
      edit={TattooEdit}
      icon={BrushIcon}
    />
    <Resource
      name="tags"
      list={TagList}
      edit={TagEdit}
      create={TagCreate}
      icon={LocalOfferIcon}
    />
    <Resource
      name="placements"
      list={PlacementList}
      edit={PlacementEdit}
      create={PlacementCreate}
      icon={PlaceIcon}
    />
    <Resource
      name="blocked-terms"
      list={BlockedTermList}
      edit={BlockedTermEdit}
      create={BlockedTermCreate}
      icon={BlockIcon}
    />
  </Admin>
);

export default AdminApp;
