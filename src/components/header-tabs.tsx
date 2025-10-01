import { View, Text } from 'react-native'
import React, { useContext, useEffect } from 'react'
import { LogOutIcon, User2Icon } from 'lucide-react-native'
import { Button } from './Button'
import AuthContext from '@/contexts/AuthContext';
import { loadUser, logout } from '@/services/AuthService';

export default function HeaderTabs() {
    const { user, setUser } = useContext(AuthContext) as any;

    useEffect(() => {
        const runEffect = async () => {
            try {
                const user = await loadUser();
                setUser(user);
            } catch (error) {
                console.log("Falha ao ler usuário", error)
            }
        };
        runEffect();
    }, []);

    async function handleLogout() {
        await logout();
        setUser(null);
    }

    return (
        <View className='flex-row items-center justify-between bg-sky-600 h-20 px-4 gap-4'>
            <View>
                <User2Icon size={30} color={'white'} />
            </View>
            <View className='flex-1'><Text className='text-xl text-white'>{user && user?.name}</Text></View>
            <View>
                <Button
                    variant={'link'}
                    onPress={handleLogout}
                    label={<LogOutIcon color={'#FFFFFF'} />}
                />
            </View>
        </View>
    )
}