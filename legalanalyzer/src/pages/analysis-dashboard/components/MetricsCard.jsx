// legalanalyzer/src/pages/analysis-dashboard/components/MetricsCard.jsx
// legalanalyzer/src/pages/analysis-dashboard/components/MetricsCard.jsx

import React from 'react';
import Icon from 'components/AppIcon';

// MetricsCard receives all display text via props (title, value, change)
// so no direct i18n hook is needed here — callers pass translated strings.
const MetricsCard = ({ title, value, change, trend, icon, color, bgColor }) => {
  const isPositive = trend === 'up';
  const changeColor = isPositive ? 'text-success' : trend === 'neutral' ? 'text-text-secondary' : 'text-error';
  const changeIcon  = isPositive ? 'TrendingUp' : trend === 'neutral' ? 'Minus' : 'TrendingDown';

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon name={icon} size={24} className={color} />
        </div>
        <div className={`flex items-center space-x-1 ${changeColor}`}>
          <Icon name={changeIcon} size={16} />
          <span className="text-sm font-medium">{change}</span>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-text-primary mb-1">{value}</h3>
        <p className="text-sm text-text-secondary">{title}</p>
      </div>
    </div>
  );
};

export default MetricsCard;