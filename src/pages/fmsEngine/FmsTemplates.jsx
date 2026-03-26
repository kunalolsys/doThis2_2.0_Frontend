import React from 'react'
import { FilePenLine, Trash2, Plus, Edit, Zap, Sparkles } from 'lucide-react';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router-dom';

// --- Data from your image ---

const templateData = [
  {
    id: 'FMS-1',
    name: 'Social Media Task FMS',
    description: 'Daily social media management tasks.',
    duration: 'Timeless',
  },
  {
    id: 'FMS-2',
    name: 'New Employee Onboarding',
    description: 'Workflow for onboarding new hires.',
    duration: 'Fixed Period',
  },
];

// --- Helper for Badges ---
const getDurationBadge = (duration) => {
  if (duration === 'Timeless') {
    return (
      <Badge
        variant="default"
        className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 text-sm px-2 py-1"
      >
        Timeless
      </Badge>
    );
  }
  if (duration === 'Fixed Period') {
    return (
      <Badge
        variant="default"
        className="bg-purple-100 text-purple-800 hover:bg-purple-100 border border-purple-200 text-sm px-2 py-1"
      >
        Fixed Period
      </Badge>
    );
  }
  return <Badge variant="outline">{duration}</Badge>;
};

// --- Main Component ---
const FmsTemplates = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-200/10 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-1000 -z-10"></div>
      
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b border-gray-200/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                FMS Templates
              </CardTitle>
            </div>
            <Link 
              to="/fms-engine/create-template" 
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center text-sm font-semibold'
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Template
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <div className="rounded-lg border border-gray-200/50 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-sm p-3">FMS ID</TableHead>
                    <TableHead className="font-semibold text-sm p-3">TEMPLATE NAME</TableHead>
                    <TableHead className="font-semibold text-sm p-3">DESCRIPTION</TableHead>
                    <TableHead className="font-semibold text-sm p-3">FMS DURATION</TableHead>
                    <TableHead className="font-semibold text-sm p-3">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templateData.map((template, index) => (
                    <TableRow key={template.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <TableCell className="font-medium p-3 text-sm">
                        {template.id}
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        {template.name}
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        {template.description}
                      </TableCell>
                      <TableCell className="p-3">
                        {getDurationBadge(template.duration)}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex gap-2">
                          <Link 
                            to={`/fms-engine/edit-template`}
                            className="h-8 w-8 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center hover:bg-blue-200 transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default FmsTemplates;