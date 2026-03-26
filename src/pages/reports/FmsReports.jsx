import React from 'react';
import { Trash2, CalendarIcon, Zap, Clock, Calendar, Archive, Filter, Download, Sparkles } from 'lucide-react';

// shadcn/ui components
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

// --- Data based on your images ---

const timelessData = [
  { id: 'FMS-TL-01', title: 'Truck Entry Security Check' },
  { id: 'FMS-TL-02', title: 'New IT Support Ticket' },
];

const fixedPeriodData = [
  { id: 'FMS-FP-01', title: 'New Employee Onboarding' },
  { id: 'FMS-FP-02', title: 'Quarterly Financial Audit' },
];

const closedData = [
  {
    id: 'fms-cl-01',
    title: 'Old Marketing Campaign FMS',
    type: 'Timeless',
    started: '2025-01-15',
    ended: '2025-09-30'
  },
  {
    id: 'fms-cl-02',
    title: '2024 Employee Onboarding Batch',
    type: 'Fixed Period',
    started: '2024-11-01',
    ended: '2024-11-30'
  },
  {
    id: 'fms-cl-03',
    title: 'Q2 Financial Audit',
    type: 'Fixed Period',
    started: '2025-04-01',
    ended: '2025-06-30'
  },
];

const FmsReports = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-200/10 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-1000 -z-10"></div>
      
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group">
        <CardHeader className="border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                FMS Reports
              </CardTitle>
            </div>
            <Button className="bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="timeless" className="group/tabs">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 p-1 rounded-lg mb-4">
              <TabsTrigger 
                value="timeless" 
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-md group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-3 h-3 text-blue-600" />
                  </div>
                  Active Timeless FMS
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="fixedPeriod" 
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-100 rounded-md group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-3 h-3 text-green-600" />
                  </div>
                  Active Fixed Period FMS
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="closed" 
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-100 rounded-md group-hover:scale-110 transition-transform duration-300">
                    <Archive className="w-3 h-3 text-purple-600" />
                  </div>
                  Closed FMS
                </div>
              </TabsTrigger>
            </TabsList>

            {/* --- Active Timeless FMS Content --- */}
            <TabsContent value="timeless" className="mt-4">
              <div className="space-y-3">
                {timelessData.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="p-3 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-500 group/item"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm group-hover/item:scale-110 transition-transform duration-300 border border-blue-200">
                          {index + 1}
                        </div>
                        <div>
                          <a href="#" className="text-lg font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 inline-block">
                            {item.title}
                          </a>
                          <p className="text-xs text-gray-600 mt-1">ID: {item.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                          Active
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 hover:scale-110 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* --- Active Fixed Period FMS Content --- */}
            <TabsContent value="fixedPeriod" className="mt-4">
              <div className="space-y-3">
                {fixedPeriodData.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="p-3 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-500 group/item"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-sm group-hover/item:scale-110 transition-transform duration-300 border border-green-200">
                          {index + 1}
                        </div>
                        <div>
                          <a href="#" className="text-lg font-semibold text-gray-700 hover:text-green-600 transition-colors duration-300 inline-block">
                            {item.title}
                          </a>
                          <p className="text-xs text-gray-600 mt-1">ID: {item.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                          Active
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 hover:scale-110 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* --- Closed FMS Content --- */}
            <TabsContent value="closed" className="mt-4">
              {/* Filters */}
              <div className="p-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg mb-4 group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-md group-hover:scale-110 transition-transform duration-300">
                    <Filter className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Filter Closed FMS</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-2 group">
                    <Label htmlFor="fms-type" className="text-sm font-medium text-gray-700">FMS Type</Label>
                    <Select>
                      <SelectTrigger id="fms-type" className="border border-gray-300 bg-white shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105 text-sm h-10">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent className="border border-gray-300 shadow-xl">
                        <SelectItem value="all" className="text-sm hover:bg-blue-50 transition-colors duration-200">All</SelectItem>
                        <SelectItem value="timeless" className="text-sm hover:bg-blue-50 transition-colors duration-200">Timeless</SelectItem>
                        <SelectItem value="fixedPeriod" className="text-sm hover:bg-blue-50 transition-colors duration-200">Fixed Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 group">
                    <Label htmlFor="end-date-from" className="text-sm font-medium text-gray-700">End Date (From)</Label>
                    <div className="relative">
                      <Input 
                        id="end-date-from" 
                        type="text" 
                        placeholder="dd-mm-yyyy" 
                        className="pr-8 border border-gray-300 bg-white shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105 text-sm h-10"
                      />
                      <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <Label htmlFor="end-date-to" className="text-sm font-medium text-gray-700">End Date (To)</Label>
                    <div className="relative">
                      <Input 
                        id="end-date-to" 
                        type="text" 
                        placeholder="dd-mm-yyyy" 
                        className="pr-8 border border-gray-300 bg-white shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105 text-sm h-10"
                      />
                      <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 h-10 text-sm">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-3">
                {closedData.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="p-3 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-500 group/item flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-bold text-sm group-hover/item:scale-110 transition-transform duration-300 border border-gray-200">
                        {index + 1}
                      </div>
                      <div>
                        <a href="#" className="text-lg font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 inline-block">
                          {item.title}
                        </a>
                        <p className="text-xs text-gray-600 mt-1">
                          ID: {item.id}
                          <span className="mx-2 text-gray-300">•</span>
                          Type: <span className="font-semibold">{item.type}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          Started: {item.started}
                          <span className="mx-2 text-gray-300">•</span>
                          Ended: {item.ended}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 hover:scale-110 transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FmsReports;