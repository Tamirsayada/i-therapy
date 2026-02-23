"use client";

interface BeliefStrengthSelectorProps {
  belief: string;
  onSelect: (strength: number) => void;
}

export function BeliefStrengthSelector({ belief, onSelect }: BeliefStrengthSelectorProps) {
  const strengthLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getStrengthColor = (level: number) => {
    if (level <= 3) return "bg-green-500 hover:bg-green-600";
    if (level <= 6) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getStrengthLabel = (level: number) => {
    if (level <= 3) return "חלשה";
    if (level <= 6) return "בינונית";
    return "חזקה";
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          מהי עוצמת האמונה המגבילה?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          &quot;{belief}&quot;
        </p>
        <p className="text-xs text-gray-500">
          בחר מ-1 (חלשה) עד 10 (חזקה מאוד)
        </p>
      </div>

      {/* Visual strength bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between mb-2 text-xs text-gray-500">
          <span>חלשה</span>
          <span>חזקה מאוד</span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 right-0 rounded-full transition-all duration-300"
            style={{
              width: "100%",
              background: "linear-gradient(to left, #ef4444 0%, #eab308 50%, #22c55e 100%)",
            }}
          />
        </div>
      </div>

      {/* Number selector buttons */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-3 w-full max-w-2xl">
        {strengthLevels.map((level) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`
              relative flex flex-col items-center justify-center
              h-16 md:h-20 rounded-lg
              ${getStrengthColor(level)}
              text-white font-bold text-xl
              transition-all duration-200
              hover:scale-105 active:scale-95
              shadow-md hover:shadow-lg
            `}
          >
            <span className="text-2xl md:text-3xl">{level}</span>
            <span className="text-[10px] md:text-xs mt-1 opacity-90">
              {getStrengthLabel(level)}
            </span>
          </button>
        ))}
      </div>

      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          💡 דירוג גבוה יותר = האמונה משפיעה יותר על חייך
        </p>
      </div>
    </div>
  );
}
