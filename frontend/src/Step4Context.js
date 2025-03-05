// src/Step4Context.js
import React, { createContext, useState, useContext } from 'react';

/**
 * 本Context专门保存 Step4(Assess Vulnerability & Risk) 相关的数据，
 * 如：Exposure, Impact, Likelihood, 等。
 */
const Step4DataContext = createContext();

export const Step4DataProvider = ({ children }) => {
  // 在此维护所有子任务的核心数据
  const [exposureData, setExposureData] = useState([]); // 用于 "Exposure to Hazards"
  const [impactData, setImpactData] = useState([]); // 用于 "Evaluate Impact"
  const [likelihoodData, setLikelihoodData] = useState([]); // 用于 "Analyze Likelihood"

  // 您也可以定义更多 state / 或通过对象形式统一管理
  return (
    <Step4DataContext.Provider
      value={{
        exposureData,
        setExposureData,
        impactData,
        setImpactData,
        likelihoodData,
        setLikelihoodData,
      }}
    >
      {children}
    </Step4DataContext.Provider>
  );
};

// 便于在各子组件中直接 useStep4Data() 获取/更新
export const useStep4Data = () => useContext(Step4DataContext);
