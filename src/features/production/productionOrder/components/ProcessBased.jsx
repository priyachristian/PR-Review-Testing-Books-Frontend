import { useState } from 'react';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import ProcessSequenceModal from './ProcessSequenceModal';

// Extras
import Icons from 'assets/icons/icon';

const ProcessBased = ({ productionItem, values, setFieldValue }) => {
  const [sequenceModalOpen, setSequenceModalOpen] = useState(false);

  return (
    <div>
      <div className="pb-2 ps-1 flex items-center justify-between gap-3 text-base">
        <div className="flex items-center gap-3">
          <div>
            <strong>Recipe Name:</strong> {productionItem?.name},
          </div>
          <div>
            <strong>Recipe No:</strong> {productionItem?.recipeId}
          </div>
        </div>
        <CustomButton text="Rearrange sequence" type="default" size="small" icon={<Icons.SwapOutlined />} disabled={values.processes.length < 2} onClick={() => setSequenceModalOpen(true)} />
      </div>
      <div>
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border px-2 py-2 bg-[#f6f7fb]">Index</th>
              <th className="border px-2 py-2 bg-[#f6f7fb]">Process Name</th>
              <th className="border px-2 py-2 bg-[#f6f7fb]">Process No</th>
            </tr>
          </thead>
          <tbody>
            {values.processes.length > 0 ? (
              values.processes.map((process, index) => (
                <tr key={process._id} className="hover:bg-blue-50 transition-all duration-300">
                  <td className="border px-4 py-2 text-center">{index + 1}</td>
                  <td className="border px-4 py-2 text-center">{process.processName}</td>
                  <td className="border px-4 py-2 text-center">{process.processNo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border px-4 py-2 text-center text-gray-500">
                  No Process Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sequenceModalOpen && (
        <ProcessSequenceModal
          processes={values.processes}
          showLock={false}
          onCancel={() => setSequenceModalOpen(false)}
          onApply={orderedProcesses => {
            setFieldValue('processes', orderedProcesses);
            setSequenceModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProcessBased;
