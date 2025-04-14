import { Avatar } from "flowbite-react";

interface AvatarIconProps {
    image: string;
    size?: string;
    onImageChange?: (imageId: string) => void;
}

const images = [
    { id: 'penguin-1', path: '/assets/avatars/penguin-1.png' },
    { id: 'penguin-2', path: '/assets/avatars/penguin-2.png' },
    { id: 'owl-1', path: '/assets/avatars/owl-1.png' },
    { id: 'owl-2', path: '/assets/avatars/owl-2.png' },
    { id: 'koala', path: '/assets/avatars/koala.png' },
    { id: 'hippopotamus', path: '/assets/avatars/hippopotamus.png' },
    { id: 'gorilla', path: '/assets/avatars/gorilla.png' },
    { id: 'frog', path: '/assets/avatars/frog.png' },
    { id: 'cat', path: '/assets/avatars/cat.png' },
]

const getImagePath = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    return image?.path || images[0].path;
};

export const AvatarIcon = ({
    image,
    size,
    onImageChange,
}: AvatarIconProps) => {
    return (
        <div className="flex flex-col items-center gap-4">
            <Avatar
                img={getImagePath(image)}
                rounded
                size={size ? size : "sm"}
            />
            {onImageChange && (
                <div className="flex gap-2 flex-wrap justify-center">
                    {images.map((avatar) => (
                        <button
                            key={avatar.id}
                            onClick={() => onImageChange(avatar.id)}
                            className={`w-12 h-12 rounded-full overflow-hidden border-2 ${image === avatar.id ? 'border-blue-500' : 'border-transparent'
                                }`}
                        >
                            <img
                                src={avatar.path}
                                alt={avatar.id}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};