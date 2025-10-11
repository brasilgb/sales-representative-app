import { PlusIcon } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Button } from './Button';

interface AppLayoutProps {
    children: ReactNode;
    title: string;
    url: any;
    icon: any;
}

export default function AppLayout({ children, title, url, icon }: AppLayoutProps) {
    return (
        <View className='flex-1 bg-primary'>
            <View className='flex-row items-center justify-between h-20 px-4'>
                <View className='flex-row items-center gap-2'>
                    {icon}
                    <Text className='text-2xl text-white font-bold'>{title}</Text>
                </View>
                <Button
                    label={<PlusIcon />}
                    variant={'default'}
                    onPress={url}
                />
            </View>
            <View className='rounded-t-3xl bg-white h-full'>
                {children}
            </View>
        </View>
    )
}