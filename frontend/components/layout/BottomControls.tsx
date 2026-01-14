'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface BottomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  selectedMinute: number | null;
  hasPoints: boolean;
  onClear: () => void;
}

export function BottomControls({
  onZoomIn,
  onZoomOut,
  selectedMinute,
  hasPoints,
  onClear,
}: BottomControlsProps) {
  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="relative bg-[#1800AD]/95 backdrop-blur-xl border-t-4 border-[#C1FF72] shadow-[0_-4px_0_0_#0a0014]">
        <div className="px-4 py-4 sm:py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onZoomOut}
                className="w-11 h-11 flex items-center justify-center bg-[#0a0014] border-3 border-[#C1FF72] rounded-lg text-[#C1FF72] text-xl font-bold shadow-[3px_3px_0_0_#C1FF72]"
                whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
                whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 0 #C1FF72' }}
              >
                −
              </motion.button>
              <motion.button
                onClick={onZoomIn}
                className="w-11 h-11 flex items-center justify-center bg-[#0a0014] border-3 border-[#C1FF72] rounded-lg text-[#C1FF72] text-xl font-bold shadow-[3px_3px_0_0_#C1FF72]"
                whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
                whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 0 #C1FF72' }}
              >
                +
              </motion.button>
            </div>

            {/* Status - Center */}
            <div className="flex-1 text-end">
              {selectedMinute && hasPoints ? (
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C1FF72]/20 border-2 border-[#C1FF72] rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <motion.span 
                    className="text-[#C1FF72]"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    ●
                  </motion.span>
                  <span className="text-sm font-bold text-[#C1FF72]">
                    +{selectedMinute}m Active
                  </span>
                </motion.div>
              ) : (
                <span className="text-sm text-[#C1FF72]/60 font-medium">
                  Draw your futures ↑
                </span>
              )}
            </div>

            {/* Clear Button */}
            <AnimatePresence>
              {hasPoints && (
                <motion.button
                  onClick={onClear}
                  className="px-5 py-2.5 bg-red-500 border-3 border-[#0a0014] rounded-lg text-white text-sm font-bold shadow-[4px_4px_0_0_#0a0014]"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ x: -2, y: -2, boxShadow: '6px 6px 0 0 #0a0014' }}
                  whileTap={{ x: 2, y: 2, boxShadow: '2px 2px 0 0 #0a0014' }}
                >
                  Clear
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
