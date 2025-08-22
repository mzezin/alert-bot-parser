import type { Message } from '../types/Message';

interface TableProps {
  messages: Message[];
}

export const MessageTable = ({ messages }: TableProps) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border-b text-left">ID</th>
            <th className="px-4 py-2 border-b text-left">Дата</th>
            <th className="px-4 py-2 border-b text-left">Текст</th>
            <th className="px-4 py-2 border-b text-left">Просмотры</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={message.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">{message.id}</td>
              <td className="px-4 py-2 border-b text-sm">
                {formatDate(message.timestamp)}
              </td>
              <td className="px-4 py-2 border-b max-w-md truncate">
                {message.text || 'Медиа сообщение'}
              </td>
              <td className="px-4 py-2 border-b">{message.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};