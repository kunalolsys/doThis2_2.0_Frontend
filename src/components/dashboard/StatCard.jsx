import React from 'react'
import { ClipboardListIcon } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  return (
    <>
    <div className="bg-white rounded-xl p-6 shadow-sm ">
      <div className="flex items-center justify-around">
        <div className={`p-3 rounded-lg`}>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
        <div>
          <p className="text-md font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.color} mt-1`}>
              {trend.value} {trend.label}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between">
        {/* <div>152</div> */}
        {/* <ClipboardListIcon/> */}
      </div>
    </div>
    </>
  )
}

export default StatCard