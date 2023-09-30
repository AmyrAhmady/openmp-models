import React, { Component, useState } from 'react';
import { View, Modal, TouchableOpacity, Text, Modal as RNModal, TextInput, FlatList } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../../utils/screensize';
import Row from '../../Row';
import { themeSelect } from 'src/resources/theme';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    onSearch?: (query: string) => void;
    onSearchEnd?: () => void;
    data: any[];
    onSelect: (model: any) => void;
}

const ModelList = (props: Props) => {

    const {
        visible,
        onRequestClose,
        onSearch,
        onSearchEnd,
        data,
        onSelect
    } = props;

    const [searchInputValue, setSearchInputValue] = useState('');

    const theme = themeSelect();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => onRequestClose()}
            onDismiss={() => onRequestClose()}
        >
            <View style={{ backgroundColor: theme.mainBg, height: '100%', width: '100%', paddingTop: 5 }}>
                <Row
                    style={{ height: 70, width: '100%', backgroundColor: 'transparent' }}
                    centerContainerStyle={{ flex: undefined }}
                    leftContainerStyle={{ height: '100%', flex: 1 }}
                    leftComponent={
                        <View style={{ width: '100%', paddingHorizontal: 10 }}>
                            <TextInput
                                value={searchInputValue}
                                style={{
                                    borderWidth: 0.5, borderRadius: 10, borderColor: '#999',
                                    height: 60, width: '100%', paddingHorizontal: 8
                                }}
                                placeholderTextColor={theme.textBoxPlaceholder}
                                placeholder={"Search for a model by name or id"}
                                onChangeText={(text) => {
                                    setSearchInputValue(text);
                                    if (text.length) {
                                        if (onSearch) {
                                            onSearch(text);
                                        }
                                    }
                                    else {
                                        if (onSearchEnd) {
                                            onSearchEnd();
                                        }
                                    }
                                }}
                            />
                        </View>
                    }
                    rightContainerStyle={{ height: '100%', flex: undefined }}
                    rightComponent={
                        <TouchableOpacity
                            onPress={() => {
                                setSearchInputValue('');
                                onSearchEnd();
                            }}
                        >
                            <Text style={{ fontSize: 30, color: 'black' }}>×</Text>
                        </TouchableOpacity>
                    }
                />
                <FlatList
                    data={data}
                    renderItem={({ item, index }) => {
                        return (
                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: wp(7)
                                }}
                                onPress={() => {
                                    if (onSelect)
                                        onSelect(item);
                                }}
                            >
                                <View
                                    style={{
                                        height: '100%', width: '100%', alignItems: 'center',
                                        paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between'
                                    }}
                                >
                                    <Text style={{ color: '#aaa', fontSize: wp(5) }}>{item.name}</Text>
                                    <Text style={{ color: '#aaa', fontSize: wp(5) }}>{item.id}</Text>
                                </View>
                                <View
                                    style={{
                                        borderBottomWidth: 0.5, borderColor: '#999', marginHorizontal: wp(2)
                                    }}
                                />
                            </TouchableOpacity>
                        )
                    }}
                />
            </View>
        </Modal>
    );
}

export default React.memo(ModelList);