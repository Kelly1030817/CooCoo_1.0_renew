import React, { useEffect, useRef } from 'react';

const RoiView = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.SingleGoalApp) {
      window.SingleGoalApp.render(containerRef.current);
    }
  }, []);

  return (
    <div className="space-y-lg pb-32 max-w-5xl mx-auto">
      {/* Production Single Goal Dream Tree Container */}
      <div ref={containerRef} className="w-full"></div>
    </div>
  );
};

export default RoiView;
