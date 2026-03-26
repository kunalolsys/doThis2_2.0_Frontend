import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Rocket, 
  CheckCircle2, 
  User, 
  Briefcase, 
  LayoutTemplate 
} from 'lucide-react';
import { format } from 'date-fns';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { cn } from '../../lib/utils';

// --- Data ---
const templates = {
  'onboarding': {
    title: 'New Employee Onboarding',
    description: 'Standard workflow for setting up new hires across departments.',
    type: 'date-range',
    tasks: [
      'Post daily update to Twitter',
      'Engage with 5 followers on Instagram',
      'Schedule weekly LinkedIn post',
    ],
  },
  'social-media': {
    title: 'Social Media Task FMS',
    description: 'Recurring social media engagement and content scheduling.',
    type: 'fixed-date',
    tasks: [
      'Post daily update to Twitter',
      'Engage with 5 followers on Instagram',
      'Schedule weekly LinkedIn post',
    ],
  },
};

const FmsLaunch = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
    setStartDate(null);
    setEndDate(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Launching FMS...', { template: selectedTemplate, startDate, endDate });
  };
  
  const currentTemplate = selectedTemplate ? templates[selectedTemplate] : null;

  return (
    <div className="bg-gray-50/50 flex items-center justify-center p-6">
      <Card className="w-full shadow-xl border-slate-200 bg-white">
        
        {/* --- Header --- */}
        <CardHeader className="bg-slate-50/50 border-b pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-800">Launch New FMS</CardTitle>
              <CardDescription>Select a workflow template to initialize a new project.</CardDescription>
            </div>
          </div>
          
          {/* --- Template Select (Prominent) --- */}
          <div className="pt-4">
            <Label htmlFor="template-select" className="text-slate-600 font-medium mb-2 block">
              Choose a Template
            </Label>
            <Select onValueChange={handleTemplateChange}>
              <SelectTrigger 
                id="template-select" 
                className="h-12 text-base bg-white border-slate-300 focus:ring-blue-500/20"
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <LayoutTemplate className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="Select a workflow template..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">New Employee Onboarding</SelectItem>
                <SelectItem value="social-media">Social Media Task FMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- Conditional Form Details (Animated) --- */}
            {currentTemplate && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                
                <div className="flex flex-col gap-1 pb-2 border-b border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    Configuration: {currentTemplate.title}
                  </h3>
                  <p className="text-sm text-slate-500">{currentTemplate.description}</p>
                </div>
                
                {/* --- Form Fields Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-slate-600">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-11 border-slate-300",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* End Date (Conditional) */}
                  {currentTemplate.type === 'date-range' ? (
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-slate-600">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="end-date"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-11 border-slate-300",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="hidden md:block"></div> // Spacer for grid alignment
                  )}

                  {/* Manager */}
                  <div className="space-y-2">
                    <Label htmlFor="manager-select" className="text-slate-600">Manager</Label>
                    <Select>
                      <SelectTrigger id="manager-select" className="h-11 border-slate-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400"/>
                          <SelectValue placeholder="Assign Manager" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baldev-singh">Baldev Singh</SelectItem>
                        <SelectItem value="priya-sharma">Priya Sharma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sr. Manager */}
                  <div className="space-y-2">
                    <Label htmlFor="sr-manager-select" className="text-slate-600">Sr. Manager</Label>
                    <Select>
                      <SelectTrigger id="sr-manager-select" className="h-11 border-slate-300">
                         <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400"/>
                          <SelectValue placeholder="Assign Sr. Manager" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atul-mohan">Atul Mohan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* --- Tasks Preview (Enhanced UI) --- */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                  <h4 className="flex items-center gap-2 font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" /> 
                    Included Tasks Preview
                  </h4>
                  <ul className="space-y-2">
                    {currentTemplate.tasks.map((task, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-slate-700 bg-white p-2 rounded border border-blue-100/50 shadow-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                          {index + 1}
                        </span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* --- Submit Button --- */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01]"
                  >
                    Launch FMS Workflow
                  </Button>
                </div>
              </div>
            )}
            
            {/* Empty State Placeholder */}
            {!currentTemplate && (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Please select a template above to begin configuration.</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FmsLaunch;