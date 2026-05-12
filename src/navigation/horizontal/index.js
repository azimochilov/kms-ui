export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
    action: 'read',
    subject: 'AclDemo',
  },
  {
    title: 'clients.title',
    to: { name: 'customers' },
    icon: { icon: 'tabler-users' },
    // children: [
    //   {
    //     title: 'clients.all', to: 'customers-all', action: 'read',
    //     subject: 'AclDemo',
    //   },

    //   {
    //     title: 'clients.new', to: 'customers-new', action: 'read',
    //     subject: 'AclDemo',
    //   },
    //   {
    //     title: 'clients.approved', to: 'customers-approved', action: 'read',
    //     subject: 'AclDemo',
    //   },
    //   {
    //     title: 'clients.rejected', to: 'customers-rejected', action: 'read',
    //     subject: 'AclDemo',
    //   }],
    action: 'read',
    subject: 'AclDemo',
  },
  {
    title: 'settings',
    to: { name: 'employees' },
    icon: { icon: 'tabler-user-cog' },
    action: 'read',
    subject: 'AclDemo',
  },
  {
    title: 'requests.title',
    to: { name: 'requests' },
    icon: { icon: 'tabler-sort-descending' },
    action: 'read',
    subject: 'AclDemo',
  },
  {
    title: 'certificates.title',
    to: { name: 'certificates' },
    icon: { icon: 'tabler-file-certificate' },
    action: 'read',
    subject: 'AclDemo',
  },
  {
    title: 'tokenModule.title',
    to: { name: 'tokens' },
    icon: { icon: 'tabler-device-usb' },
    action: 'read',
    subject: 'AclDemo',
  },
  {
    title: 'reports.title',
    to: { name: 'reports' },
    icon: { icon: 'tabler-chart-bar' },
    action: 'read',
    subject: 'AclDemo',
  },
  {
    title: 'logs.title',
    to: { name: 'logs' },
    icon: { icon: 'tabler-file-text' },
    action: 'read',
    subject: 'AclDemo',
  },
]
