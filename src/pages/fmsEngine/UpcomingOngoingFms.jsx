import React from 'react';
import { FilePenLine, Settings, Trash2, Search } from 'lucide-react';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// --- Data from your images ---

const upcomingData = [
  {
    launchId: 'FMS-2-L1',
    launchDate: '2025-10-30',
    name: 'New Employee Onboarding',
    description: 'Workflow for onboarding new hires.',
    duration: 'Fixed Period',
    srManager: 'Atul Mohan',
    manager: 'Baldev Singh',
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    status: 'Scheduled',
  },
];

const ongoingData = [
  {
    launchId: 'FMS-1-L1',
    launchDate: '2025-10-19',
    name: 'Social Media Task FMS',
    description: 'Daily social media management tasks.',
    duration: 'Timeless',
    srManager: 'Atul Mohan',
    manager: 'Baldev Singh',
    startDate: '2025-10-20',
    endDate: 'NA',
    status: 'In Progress',
  },
  {
    launchId: 'FMS-2-L1',
    launchDate: '2025-10-21',
    name: 'Quarterly Financial Audit',
    description: 'Complete Q3 financial audit and reporting.',
    duration: 'Fixed Period',
    srManager: 'Atul Mohan',
    manager: 'Baldev Singh',
    startDate: '2025-10-22',
    endDate: '2025-12-31',
    status: 'In Progress',
  },
];

// --- Reusable Helper Components ---

// Helper for Status Badges (to match your image style)
const getStatusBadge = (status) => {
  if (status === 'In Progress') {
    return (
      <Badge
        variant="default"
        className="bg-blue-100 text-blue-800 hover:bg-blue-100"
      >
        {status}
      </Badge>
    );
  }
  if (status === 'Scheduled') {
    return (
      <Badge
        variant="default"
        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      >
        {status}
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
};

// Helper for Table Header (to avoid duplication)
const FmsTableHeader = () => (
  <TableHeader>
    <TableRow>
      <TableHead className="whitespace-nowrap">LAUNCH ID</TableHead>
      <TableHead className="whitespace-nowrap">LAUNCH DATE</TableHead>
      <TableHead className="whitespace-nowrap">FMS NAME</TableHead>
      <TableHead className="whitespace-nowrap">DESCRIPTION</TableHead>
      <TableHead className="whitespace-nowrap">FMS DURATION</TableHead>
      <TableHead className="whitespace-nowrap">SR. MANAGER</TableHead>
      <TableHead className="whitespace-nowrap">MANAGER</TableHead>
      <TableHead className="whitespace-nowrap">START DATE</TableHead>
      <TableHead className="whitespace-nowrap">END DATE</TableHead>
      <TableHead className="whitespace-nowrap">OVERALL STATUS</TableHead>
      <TableHead className="text-right whitespace-nowrap">ACTIONS</TableHead>
    </TableRow>
  </TableHeader>
);

// Helper for Action Icons (to avoid duplication)
const FmsTableActions = () => (
  <TableCell className="text-right whitespace-nowrap">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <FilePenLine className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-500">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </TableCell>
);

// --- Main Component ---
const UpcomingOngoingFms = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filterData = (data) => {
    return data.filter((fms) =>
      Object.values(fms).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  return (
    <div className="m-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-blue-700 font-semibold">FMS Status</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search FMS..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming FMSs</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing FMSs</TabsTrigger>
            </TabsList>

            {/* --- Upcoming FMSs Tab --- */}
            <TabsContent value="upcoming" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <FmsTableHeader />
                  <TableBody>
                    {filterData(upcomingData).map((fms) => (
                      <TableRow key={fms.launchId} className="hover:bg-muted/50">
                        <TableCell className="font-medium whitespace-nowrap">{fms.launchId}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.launchDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.description}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.duration}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.srManager}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.manager}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.startDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.endDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(fms.status)}</TableCell>
                        <FmsTableActions />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* --- Ongoing FMSs Tab --- */}
            <TabsContent value="ongoing" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <FmsTableHeader />
                  <TableBody>
                    {filterData(ongoingData).map((fms) => (
                      <TableRow key={fms.launchId} className="hover:bg-muted/50">
                        <TableCell className="font-medium whitespace-nowrap">{fms.launchId}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.launchDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.description}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.duration}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.srManager}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.manager}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.startDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{fms.endDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(fms.status)}</TableCell>
                        <FmsTableActions />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingOngoingFms;