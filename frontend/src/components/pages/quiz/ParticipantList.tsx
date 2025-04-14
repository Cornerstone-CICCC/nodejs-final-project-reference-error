import { Badge } from 'flowbite-react';
import { AvatarIcon } from '@/components/ui/AvatarIcon';

interface Participant {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
}

interface ParticipantListProps {
    participants: Participant[];
}

export const ParticipantList = ({ participants }: ParticipantListProps) => {
    return (
        <div className="">
            {participants.map((participant) => (
                <div
                    key={participant.id}
                    className="flex items-center justify-between p-3"
                >
                    <div className="flex items-center space-x-3">
                        <AvatarIcon image={participant.avatar} />
                        <div className='flex items-center space-x-2'>
                            <p className="font-medium">{participant.name}</p>
                            {participant.isHost && (
                                <Badge color="blue">
                                    Host
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {participants.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                    No participants yet
                </div>
            )}
        </div>
    );
}; 