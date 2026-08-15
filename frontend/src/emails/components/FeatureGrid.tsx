import * as React from'react';
import { Text } from'@react-email/components'; interface FeatureItem { title: string; description: string;
} interface FeatureGridProps { features: FeatureItem[];
} export const FeatureGrid = ({ features }: FeatureGridProps) => { return ( <> {features.map((feature, index) => ( <Text key={index} className="text-gray-700 text-[16px] leading-[26px] my-[8px]"> <strong className="text-black">✓ {feature.title}:</strong> {feature.description} </Text> ))} </> );
}; export default FeatureGrid;
