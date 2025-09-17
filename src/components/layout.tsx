import { View, Text } from 'react-native'
import React, { ReactNode } from 'react'
import { Button } from './Button';
import { PlusIcon } from 'lucide-react-native';

interface AppLayoutProps {
    children: ReactNode;
    title: string;
    url: string;
    icon: any;
}

export default function AppLayout({ children, title, url, icon }: AppLayoutProps) {
    return (
        <View className='flex-1 bg-sky-600'>
            <View className='flex-row items-center justify-between h-20 px-4'>
                <View className='flex-row items-center gap-2'>
                    {icon}
                    <Text className='text-2xl text-white font-bold'>{title}</Text>
                </View>
                <Button
                label={<PlusIcon />}
                variant={'default'}
                link={url}
                />
            </View>
            <View className='rounded-t-3xl bg-white h-full'>
                {children}
            </View>
        </View>
    )
}