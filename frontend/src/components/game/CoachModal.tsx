'use client';
import { useGameStore } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import { api } from '@/lib/api';

export default function CoachModal({ onClose }: { onClose: () => void }) {
  const { lastGameLogId, coachFeedback, isLoadingCoach, setCoachFeedback, setIsLoadingCoach } = useGameStore();
  const { token } = useUserStore();

  const requestCoach = async () => {
    if (!token || !lastGameLogId) return;
    setIsLoadingCoach(true);
    try {
      const { feedback } = await api.getCoach(lastGameLogId, token);
      setCoachFeedback(feedback);
    } catch {
      setCoachFeedback('ไม่สามารถโหลด AI Coach ได้ในขณะนี้');
    } finally {
      setIsLoadingCoach(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">🤖 AI Coach วิเคราะห์เกม</h2>

        {!coachFeedback && (
          <button
            onClick={requestCoach}
            disabled={isLoadingCoach}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoadingCoach ? 'กำลังวิเคราะห์...' : 'ขอคำแนะนำจาก AI'}
          </button>
        )}

        {coachFeedback && (
          <div
            className="text-gray-700 leading-relaxed mt-2 [&>p]:mb-2"
            dangerouslySetInnerHTML={{ __html: coachFeedback }}
          />
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
