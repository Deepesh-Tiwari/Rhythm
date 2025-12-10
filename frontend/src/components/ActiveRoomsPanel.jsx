import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const ActiveRoomsPanel = () => {
  // In the future, you would fetch a list of active rooms here.
  return (
    <div className="card bg-base-200 shadow-lg h-full hidden lg:block">
      <div className="card-body">
        <h2 className="card-title text-xl mb-4">
          <ChatBubbleLeftRightIcon className="h-6 w-6 mr-1" />
          Active Rooms
        </h2>
        <div className="space-y-3">
          {/* Placeholder for a room list item */}
          <div className="p-3 bg-base-300 rounded-lg">
            <p className="font-bold">Lofi Beats to Study To</p>
            <p className="text-sm text-base-content/70">34 listeners</p>
          </div>
          <div className="p-3 bg-base-300 rounded-lg">
            <p className="font-bold">90s Rock Anthems</p>
            <p className="text-sm text-base-content/70">12 listeners</p>
          </div>
          <p className="italic text-base-content/70 pt-4">
            This panel will show currently active listening rooms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActiveRoomsPanel;