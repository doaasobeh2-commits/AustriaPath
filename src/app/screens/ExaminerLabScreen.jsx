import { getAIErrorLog } from "../../ai/examinerMind/learning/errorLearningEngine";

export default function ExaminerLabScreen() {

  const errors = getAIErrorLog();

  return (
    <div style={{ padding:20 }}>

      <h2>🧠 Examiner Lab</h2>

      <p>
        Gespeicherte AI-Fälle: {errors.length}
      </p>

      {errors.map((item,index)=>(
        <div
          key={index}
          style={{
            border:"1px solid #ddd",
            borderRadius:12,
            padding:16,
            marginBottom:16
          }}
        >

          <h4>Fall #{index+1}</h4>

          <p>Score: {item.score}</p>

          <p>Confidence: {item.confidence}%</p>

          <p>
            Warnings:
            {item.warnings?.length || 0}
          </p>

          <p>
            Conflicts:
            {item.conflicts?.length || 0}
          </p>

          <button>
            ✅ Correct
          </button>

          <button style={{marginLeft:10}}>
            ❌ Wrong
          </button>

          <button style={{marginLeft:10}}>
            ➕ Neue Regel
          </button>

        </div>
      ))}

    </div>
  );
}