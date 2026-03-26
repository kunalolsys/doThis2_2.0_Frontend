import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import {
  RadioGroup,
  RadioGroupItem
} from '../../components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';

// --- Initial Task Data from your image ---
const initialTasks = [
  {
    id: 'FMS-1-01',
    description: 'Post daily update to Twitter',
    dept: 'marketing',
    doer: 'jane-doe',
    checklist: true,
    isDependent: 'no',
    dependentOn: '',
    frequency: 'daily',
    value: '',
    startTime: 'none',
    decisionStep: 'no',
    ifTrue: '',
    ifFalse: '',
  },
  {
    id: 'FMS-1-02',
    description: 'Engage with 5 followers',
    dept: 'marketing',
    doer: 'john-smith',
    checklist: true,
    isDependent: 'no',
    dependentOn: '',
    frequency: 'daily',
    value: '',
    startTime: 'none',
    decisionStep: 'no',
    ifTrue: '',
    ifFalse: '',
  },
  {
    id: 'FMS-1-03',
    description: 'Schedule weekly post',
    dept: 'marketing',
    doer: 'jane-doe',
    checklist: true,
    isDependent: 'no',
    dependentOn: '',
    frequency: 'daily',
    value: '',
    startTime: 'none',
    decisionStep: 'no',
    ifTrue: '',
    ifFalse: '',
  },
];

// --- Main Component ---
const EditFmsTem = () => {
  // State for the list of tasks
  const [tasks, setTasks] = useState(initialTasks);
  
  // Function to add a new task
  const addTask = () => {
    const newId = `FMS-1-0${tasks.length + 1}`; // Simple ID generation
    setTasks([
      ...tasks,
      {
        id: newId,
        description: '',
        dept: '',
        doer: '',
        checklist: false,
        isDependent: 'no',
        dependentOn: '',
        frequency: 'none',
        value: '',
        startTime: 'none',
        decisionStep: 'no',
        ifTrue: '',
        ifFalse: '',
      },
    ]);
  };

  // Function to remove a task
  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };
  
  // Handle changes in the task table
  const handleTaskChange = (index, field, value) => {
     const newTasks = [...tasks];
     newTasks[index][field] = value;
     setTasks(newTasks);
  };


  return (
    <Card className="m-6 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            Edit FMS Template (ID: FMS-1)
          </CardTitle>
          <Button>Replace Doer</Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-8">
          
          {/* --- Template Details Section --- */}
          <div className="space-y-6">
            <h3 className="text-md font-semibold text-gray-800">Template Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fms-id">FMS ID</Label>
                <Input id="fms-id" value="FMS-1" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input id="template-name" placeholder="Enter template name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter description" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>FMS Duration</Label>
                <RadioGroup defaultValue="timeless" className="flex gap-6 pt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="timeless" id="r-timeless" />
                    <Label htmlFor="r-timeless" className="font-normal">Timeless</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="r-fixed" />
                    <Label htmlFor="r-fixed" className="font-normal">Fixed Period</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Select defaultValue="baldev-singh">
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baldev-singh">Baldev Singh</SelectItem>
                    <SelectItem value="priya-sharma">Priya Sharma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sr-manager">Sr. Manager</Label>
                <Select defaultValue="atul-mohan">
                  <SelectTrigger id="sr-manager">
                    <SelectValue placeholder="Select a sr. manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atul-mohan">Atul Mohan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* --- Task List Section --- */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold text-gray-800">Task List</h3>
              <Button variant="outline" type="button">Bulk Upload Tasks</Button>
            </div>

            {/* --- Task Filters --- */}
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="Search by Task ID or Description..."
                className="max-w-xs"
              />
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Doers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doers</SelectItem>
                  <SelectItem value="jane-doe">Jane Doe</SelectItem>
                  <SelectItem value="john-smith">John Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">TASK ID</TableHead>
                    <TableHead className="whitespace-nowrap">TASK DESCRIPTION</TableHead>
                    <TableHead className="whitespace-nowrap">DEPT</TableHead>
                    <TableHead className="whitespace-nowrap">DOER</TableHead>
                    <TableHead className="whitespace-nowrap">CHECKLIST</TableHead>
                    <TableHead className="whitespace-nowrap">IS IT DEPENDENT?</TableHead>
                    <TableHead className="whitespace-nowrap">DEPENDENT ON?</TableHead>
                    <TableHead className="whitespace-nowrap">FREQUENCY</TableHead>
                    <TableHead className="whitespace-nowrap">VALUE</TableHead>
                    <TableHead className="whitespace-nowrap">START TIME SETTING</TableHead>
                    <TableHead className="whitespace-nowrap">DECISION STEP?</TableHead>
                    <TableHead className="whitespace-nowrap">IF TRUE {'>'} STEP</TableHead>
                    <TableHead className="whitespace-nowrap">IF FALSE {'>'} STEP</TableHead>
                    <TableHead className="whitespace-nowrap">CREATE FORM</TableHead>
                    <TableHead className="whitespace-nowrap">NOTIFICATIONS</TableHead>
                    <TableHead className="whitespace-nowrap">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input value={task.id} disabled className="w-24"/>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={task.description} 
                          onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                          className="w-48"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={task.dept}
                          onValueChange={(val) => handleTaskChange(index, 'dept', val)}
                        >
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="it">IT</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                       <TableCell>
                        <Select
                          value={task.doer}
                          onValueChange={(val) => handleTaskChange(index, 'doer', val)}
                        >
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jane-doe">Jane Doe</SelectItem>
                            <SelectItem value="john-smith">John Smith</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Checkbox 
                          checked={task.checklist}
                          onCheckedChange={(val) => handleTaskChange(index, 'checklist', val)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.isDependent}
                          onValueChange={(val) => handleTaskChange(index, 'isDependent', val)}
                        >
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select disabled={task.isDependent === 'no'}>
                          <SelectTrigger className="w-36"><SelectValue placeholder="Select task" /></SelectTrigger>
                          <SelectContent>
                            {/* This would be populated with other tasks */}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.frequency}
                          onValueChange={(val) => handleTaskChange(index, 'frequency', val)}
                        >
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input className="w-24" />
                      </TableCell>
                       <TableCell>
                        <Select
                          value={task.startTime}
                          onValueChange={(val) => handleTaskChange(index, 'startTime', val)}
                        >
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="specific-time">Specific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                       <TableCell>
                        <Select
                          value={task.decisionStep}
                          onValueChange={(val) => handleTaskChange(index, 'decisionStep', val)}
                        >
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input disabled={task.decisionStep === 'no'} className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Input disabled={task.decisionStep === 'no'} className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Button variant="link" type="button" className="p-0 h-auto">Create Form</Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="link" type="button" className="p-0 h-auto">Setup</Button>
                      </TableCell>
                       <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          type="button" 
                          onClick={() => removeTask(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={addTask}
              className="text-blue-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>

          {/* --- Form Actions --- */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
};

export default EditFmsTem;