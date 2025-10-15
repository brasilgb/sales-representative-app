import { View, Text } from 'react-native'
import React from 'react'
import { LogOutIcon, User2Icon } from 'lucide-react-native'
import { Button } from './Button'
import { useAuth } from '@/contexts/AuthContext';

export default function HeaderTabs() {
    const { signOut, user } = useAuth();

    return (
                <View className='flex-row items-center justify-between bg-primary h-20 px-4 gap-4'>
                    <View>
                        <User2Icon size={30} color={'white'} />
                    </View>
                    <View className='flex-1'><Text className='text-xl text-white'>{user?.name}</Text></View>
                    <View>
                        <Button
                            variant={'link'}
                            onPress={() => signOut()}
                            label={<LogOutIcon color={'#FFFFFF'} />}
                        />
                    </View>
                </View>
    )
}