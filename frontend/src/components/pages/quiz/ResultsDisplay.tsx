import { Card, Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from 'flowbite-react';

interface PlayerResult {
    id: string;
    name: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    averageTime: number;
}

interface ResultsDisplayProps {
    results: PlayerResult[];
    currentPlayerId: string;
}

export const ResultsDisplay = ({ results, currentPlayerId }: ResultsDisplayProps) => {
    const sortedResults = [...results].sort((a, b) => b.score - a.score);

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <h2 className="text-2xl font-bold mb-6 text-center">Final Results</h2>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHead>
                            <TableHeadCell>Rank</TableHeadCell>
                            <TableHeadCell>Name</TableHeadCell>
                            <TableHeadCell>Score</TableHeadCell>
                            <TableHeadCell>Correct Answers</TableHeadCell>
                            <TableHeadCell>Average Time</TableHeadCell>
                        </TableHead>
                        <TableBody>
                            {sortedResults.map((player, index) => (
                                <TableRow
                                    key={player.id}
                                    className={
                                        player.id === currentPlayerId
                                            ? 'bg-blue-50'
                                            : undefined
                                    }
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">
                                        {player.name}
                                        {player.id === currentPlayerId && ' (You)'}
                                    </TableCell>
                                    <TableCell>{player.score} pts</TableCell>
                                    <TableCell>
                                        {player.correctAnswers} / {player.totalQuestions}
                                    </TableCell>
                                    <TableCell>
                                        {player.averageTime.toFixed(1)} sec
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <h3 className="text-xl font-semibold">Your Performance</h3>
                    {(() => {
                        const currentPlayer = results.find(
                            (player) => player.id === currentPlayerId
                        );
                        if (!currentPlayer) return null;

                        const rank = sortedResults.findIndex(
                            (player) => player.id === currentPlayerId
                        ) + 1;
                        const totalPlayers = results.length;
                        const correctRate =
                            (currentPlayer.correctAnswers / currentPlayer.totalQuestions) * 100;

                        return (
                            <div className="space-y-2 text-gray-600">
                                <p>Rank: {rank} / {totalPlayers}</p>
                                <p>Accuracy: {correctRate.toFixed(1)}%</p>
                                <p>Average Time: {currentPlayer.averageTime.toFixed(1)} sec</p>
                            </div>
                        );
                    })()}
                </div>
            </Card>
        </div>
    );
}; 